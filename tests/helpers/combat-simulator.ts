import { createAppHarness } from "./browser-harness";
import {
  scoreArmorProfile,
  scoreBossAdjustedPartyPower,
  scoreBossReadiness,
  scoreEncounterPowerFromDefinition,
  scorePartyPower,
  scoreWeaponProfile,
} from "./balance-power-score";
import { SIMULATION_SCORING_WEIGHTS } from "./run-progression-simulator-core";
import {
  getEnemyStatusScore,
  getHeroDebuffScore,
  getIncomingThreat,
  getThreatPressure,
  hasChargeThreat,
} from "./run-progression-simulator-combat";

const DEFAULT_CLASS_IDS = ["amazon", "assassin", "barbarian", "druid", "necromancer", "paladin", "sorceress"] as const;

const DEFAULT_MERCENARY_BY_CLASS: Record<string, string> = {
  amazon: "rogue_scout",
  assassin: "rogue_scout",
  barbarian: "desert_guard",
  druid: "desert_guard",
  necromancer: "iron_wolf",
  paladin: "desert_guard",
  sorceress: "iron_wolf",
};

const CARD_EFFECT_WEIGHTS = SIMULATION_SCORING_WEIGHTS.cardEffectBase;

interface RewardPackageDefinition {
  heroMaxLife: number;
  heroMaxEnergy: number;
  heroPotionHeal: number;
  mercenaryAttack: number;
  mercenaryMaxLife: number;
  extraPotions: number;
}

interface BalanceScenarioDefinition {
  id: string;
  label: string;
  actNumber: number;
  targetLevel: number;
  deckAdditions: number;
  potionCount: number;
  maxTurns: number;
  attributeWeights: Record<keyof RunAttributeState, number>;
  rewardPackage: RewardPackageDefinition;
  rarityBySlot: Partial<Record<LoadoutSlotKey | EquipmentSlot, string>>;
  uniqueSlots: LoadoutSlotKey[];
  notes: string[];
}

interface BalanceEncounterEntry {
  encounterId: string;
  encounterName: string;
  zoneTitle: string;
  zoneKind: ZoneKind;
  hasBoss: boolean;
  hasMiniboss: boolean;
  hasElite: boolean;
}

interface SimulationBuildSummary {
  classId: string;
  className: string;
  mercenaryId: string;
  mercenaryName: string;
  level: number;
  actNumber: number;
  deckSize: number;
  deckPreview: string[];
  addedCards: string[];
  potions: number;
  powerScore: number;
  bossReadinessScore: number;
  bossAdjustedPowerScore: number;
  powerBreakdown: {
    offense: number;
    defense: number;
    sustain: number;
    utility: number;
    deck: number;
    equipment: number;
    progression: number;
    resources: number;
  };
  hero: {
    maxLife: number;
    maxEnergy: number;
    handSize: number;
    potionHeal: number;
    damageBonus: number;
    guardBonus: number;
    burnBonus: number;
  };
  mercenary: {
    maxLife: number;
    attack: number;
  };
  weapon: {
    itemId: string;
    name: string;
    family: string;
    rarity: string;
  } | null;
  armorResistances: Array<{ type: DamageType; amount: number }>;
  armorImmunities: DamageType[];
  notes: string[];
}

interface EncounterSimulationSummary {
  encounterId: string;
  encounterName: string;
  zoneTitle: string;
  zoneKind: ZoneKind;
  kind: "boss" | "miniboss" | "elite" | "battle";
  runs: number;
  enemyPowerScore: number;
  powerDelta: number;
  powerRatio: number;
  winRate: number;
  wins: number;
  losses: number;
  timeouts: number;
  averageTurns: number;
  averageHeroLifePct: number;
  averageMercenaryLifePct: number;
  averagePotionsRemaining: number;
  averageEnemyLifePct: number;
  openingHandFullSpendRate: number;
  averageTurn1UnspentEnergy: number;
  averageEarlyUnspentEnergy: number;
  averageEarlyMeaningfulUnplayedRate: number;
  averageEarlyCandidateCount: number;
  averageEarlyMeaningfulCandidateCount: number;
  averageEarlyDecisionScoreSpread: number;
  earlyCloseDecisionRate: number;
  averageEarlyEndTurnRegret: number;
}

interface ScenarioBalanceReport {
  scenarioId: string;
  label: string;
  assumptions: string[];
  build: SimulationBuildSummary;
  encounters: EncounterSimulationSummary[];
  overall: {
    winRate: number;
    wins: number;
    losses: number;
    timeouts: number;
    averageTurns: number;
    averageHeroLifePct: number;
    averageMercenaryLifePct: number;
    averagePotionsRemaining: number;
    averageEnemyLifePct: number;
    openingHandFullSpendRate?: number;
    averageTurn1UnspentEnergy?: number;
    averageEarlyUnspentEnergy?: number;
    averageEarlyMeaningfulUnplayedRate?: number;
    averageEarlyCandidateCount?: number;
    averageEarlyMeaningfulCandidateCount?: number;
    averageEarlyDecisionScoreSpread?: number;
    earlyCloseDecisionRate?: number;
    averageEarlyEndTurnRegret?: number;
  };
}

interface ClassBalanceReport {
  classId: string;
  className: string;
  scenarios: ScenarioBalanceReport[];
}

export interface BalanceSimulationReport {
  generatedAt: string;
  encounterSetId: string;
  encounterSetLabel: string;
  runsPerEncounter: number;
  classReports: ClassBalanceReport[];
}

export interface BalanceSimulationOptions {
  classIds?: string[];
  scenarioIds?: string[];
  encounterSetId?: string;
  runsPerEncounter?: number;
  encounterLimit?: number;
}

interface SimulatedBuildContext {
  harness: ReturnType<typeof createAppHarness>;
  state: AppState;
  run: RunState;
  scenario: BalanceScenarioDefinition;
  classId: string;
  className: string;
  mercenaryId: string;
  deck: string[];
  addedCards: string[];
}

interface CombatCandidateAction {
  type: "card" | "melee" | "potion" | "end_turn";
  score: number;
  instanceId?: string;
  targetId?: string;
  targetName?: string;
  potionTarget?: "hero" | "mercenary";
}

const BALANCE_SCENARIOS: Record<string, BalanceScenarioDefinition> = {
  mainline_conservative: {
    id: "mainline_conservative",
    label: "Mainline Conservative",
    actNumber: 5,
    targetLevel: 35,
    deckAdditions: 4,
    potionCount: 3,
    maxTurns: 24,
    attributeWeights: {
      strength: 0.45,
      dexterity: 0.1,
      vitality: 0.35,
      energy: 0.1,
    },
    rewardPackage: {
      heroMaxLife: 0,
      heroMaxEnergy: 0,
      heroPotionHeal: 0,
      mercenaryAttack: 0,
      mercenaryMaxLife: 0,
      extraPotions: 0,
    },
    rarityBySlot: {
      weapon: "yellow",
      armor: "yellow",
      helm: "blue",
      shield: "blue",
      gloves: "blue",
      boots: "blue",
      belt: "blue",
      ring: "blue",
      amulet: "blue",
    },
    uniqueSlots: [],
    notes: [
      "Uses a plausible Act V mainline level with no discretionary boss-boon package.",
      "Builds a mixed blue/yellow loadout with no guaranteed unique.",
    ],
  },
  mainline_rewarded: {
    id: "mainline_rewarded",
    label: "Mainline Rewarded",
    actNumber: 5,
    targetLevel: 35,
    deckAdditions: 6,
    potionCount: 4,
    maxTurns: 26,
    attributeWeights: {
      strength: 0.45,
      dexterity: 0.1,
      vitality: 0.3,
      energy: 0.15,
    },
    rewardPackage: {
      heroMaxLife: 18,
      heroMaxEnergy: 1,
      heroPotionHeal: 2,
      mercenaryAttack: 1,
      mercenaryMaxLife: 6,
      extraPotions: 0,
    },
    rarityBySlot: {
      weapon: "yellow",
      armor: "yellow",
      helm: "yellow",
      shield: "yellow",
      gloves: "yellow",
      boots: "yellow",
      belt: "yellow",
      ring: "blue",
      amulet: "yellow",
    },
    uniqueSlots: [],
    notes: [
      "Assumes a reasonable set of survival-focused boss boons by late Act V.",
      "Keeps the loadout rare-heavy but still does not assume a guaranteed unique drop.",
    ],
  },
  full_clear_power: {
    id: "full_clear_power",
    label: "Full-Clear Power",
    actNumber: 5,
    targetLevel: 55,
    deckAdditions: 8,
    potionCount: 5,
    maxTurns: 30,
    attributeWeights: {
      strength: 0.5,
      dexterity: 0.1,
      vitality: 0.25,
      energy: 0.15,
    },
    rewardPackage: {
      heroMaxLife: 30,
      heroMaxEnergy: 1,
      heroPotionHeal: 4,
      mercenaryAttack: 2,
      mercenaryMaxLife: 10,
      extraPotions: 0,
    },
    rarityBySlot: {
      weapon: "brown",
      armor: "yellow",
      helm: "yellow",
      shield: "yellow",
      gloves: "yellow",
      boots: "yellow",
      belt: "yellow",
      ring: "yellow",
      amulet: "yellow",
    },
    uniqueSlots: ["weapon"],
    notes: [
      "Assumes a full-combat run and a single high-impact unique weapon drop.",
      "Still avoids runes and runewords so the estimate stays below a true max-roll build.",
    ],
  },
};

const ENCOUNTER_SET_LABELS: Record<string, string> = {
  act5_bosses: "Act V Bosses",
  act5_unique_packs: "Act V Elite And Miniboss Packs",
  act5_endgame: "Act V Bosses And Elite Packs",
  act5_all: "All Act V Combat Encounters",
};

function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, value));
}

function roundTo(value: number, digits = 2) {
  const factor = 10 ** digits;
  return Math.round(value * factor) / factor;
}

function hashString(value: string) {
  let hash = 2166136261;
  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

function createSeededRandom(seed: number): RandomFn {
  let state = (seed >>> 0) || 1;
  return () => {
    state = (Math.imul(state, 1664525) + 1013904223) >>> 0;
    return state / 0x100000000;
  };
}

function uniqueList(values: string[]) {
  return Array.from(new Set(values.filter(Boolean)));
}

function createQuietAppHarness() {
  const originalWarn = console.warn;
  console.warn = (...args: unknown[]) => {
    const message = String(args[0] || "");
    if (message.startsWith("getTreeArchetype:")) {
      return;
    }
    originalWarn(...args);
  };
  try {
    return createAppHarness();
  } finally {
    console.warn = originalWarn;
  }
}

function getScenarioDefinitions(scenarioIds: string[] | undefined) {
  const resolvedIds = scenarioIds && scenarioIds.length > 0 ? scenarioIds : ["mainline_rewarded"];
  return resolvedIds.map((scenarioId) => {
    const scenario = BALANCE_SCENARIOS[scenarioId];
    if (!scenario) {
      throw new Error(`Unknown balance scenario: ${scenarioId}`);
    }
    return scenario;
  });
}

function getMercenaryIdForClass(classId: string) {
  return DEFAULT_MERCENARY_BY_CLASS[classId] || "rogue_scout";
}

function scoreItemForSlot(item: RuntimeItemDefinition, slotKey: LoadoutSlotKey, preferredFamilies: string[]) {
  const bonuses = item.bonuses || {};
  const baseScore =
    Number(bonuses.heroDamageBonus || 0) * 12 +
    Number(bonuses.heroGuardBonus || 0) * 9 +
    Number(bonuses.heroMaxLife || 0) * 5 +
    Number(bonuses.heroMaxEnergy || 0) * 4 +
    Number(bonuses.heroPotionHeal || 0) * 4 +
    Number(bonuses.heroBurnBonus || 0) * 4 +
    Number(bonuses.mercenaryAttack || 0) * 4 +
    Number(bonuses.mercenaryMaxLife || 0) * 2;
  const progressionScore = Number(item.progressionTier || 1) * 6;
  const profileScore = scoreWeaponProfile(item.weaponProfile) + scoreArmorProfile(item.armorProfile);
  const preferredFamilyBonus = slotKey === "weapon" && preferredFamilies.includes(item.family || "") ? 60 : 0;
  return baseScore + progressionScore + profileScore + preferredFamilyBonus;
}

function getTopItemsForBuild(harness: ReturnType<typeof createAppHarness>, content: GameContent, classId: string) {
  const allItems = Object.values(content.itemCatalog || {}) as RuntimeItemDefinition[];
  const preferredWeaponFamilies = harness.classRegistry.getPreferredWeaponFamilies(classId);
  const rankedBySlot: Record<LoadoutSlotKey, RuntimeItemDefinition[]> = {
    weapon: [],
    armor: [],
    helm: [],
    shield: [],
    gloves: [],
    boots: [],
    belt: [],
    ring1: [],
    ring2: [],
    amulet: [],
  };

  const ringCandidates = allItems
    .filter((item) => item.slot === "ring")
    .sort((left, right) => {
      return scoreItemForSlot(right, "ring1", preferredWeaponFamilies) - scoreItemForSlot(left, "ring1", preferredWeaponFamilies);
    });
  rankedBySlot.ring1 = ringCandidates;
  rankedBySlot.ring2 = ringCandidates;

  (["weapon", "armor", "helm", "shield", "gloves", "boots", "belt", "amulet"] as LoadoutSlotKey[]).forEach((slotKey) => {
    const slot = slotKey === "ring1" || slotKey === "ring2" ? "ring" : slotKey;
    let candidates = allItems.filter((item) => item.slot === slot);
    if (slotKey === "weapon" && preferredWeaponFamilies.length > 0) {
      const preferredCandidates = candidates.filter((item) => preferredWeaponFamilies.includes(item.family || ""));
      if (preferredCandidates.length > 0) {
        candidates = preferredCandidates;
      }
    }
    rankedBySlot[slotKey] = candidates.sort((left, right) => {
      return scoreItemForSlot(right, slotKey, preferredWeaponFamilies) - scoreItemForSlot(left, slotKey, preferredWeaponFamilies);
    });
  });

  return rankedBySlot;
}

function getSlotRarity(slotKey: LoadoutSlotKey, scenario: BalanceScenarioDefinition) {
  return (
    scenario.rarityBySlot[slotKey] ||
    scenario.rarityBySlot[slotKey === "ring1" || slotKey === "ring2" ? "ring" : slotKey] ||
    "white"
  );
}

function equipScenarioLoadout(context: SimulatedBuildContext) {
  const { harness, run, classId, scenario } = context;
  const rankedBySlot = getTopItemsForBuild(harness, harness.content, classId);
  const itemCatalog = harness.browserWindow.ROUGE_ITEM_CATALOG;
  const slotKeys: LoadoutSlotKey[] = ["weapon", "armor", "helm", "shield", "gloves", "boots", "belt", "ring1", "ring2", "amulet"];
  const usedItemIds = new Set<string>();

  slotKeys.forEach((slotKey) => {
    const candidates = rankedBySlot[slotKey];
    const selectedItem = candidates.find((item) => slotKey !== "ring2" || !usedItemIds.has(item.id)) || candidates[0] || null;
    if (!selectedItem) {
      return;
    }

    if (slotKey !== "ring1" && slotKey !== "ring2") {
      usedItemIds.add(selectedItem.id);
    }

    const rarity = scenario.uniqueSlots.includes(slotKey) ? "brown" : getSlotRarity(slotKey, scenario);
    const seed = hashString([scenario.id, classId, slotKey, selectedItem.id, rarity].join("|"));
    const randomFn = createSeededRandom(seed);
    const rarityBonuses = itemCatalog.generateRarityBonuses(selectedItem, rarity, randomFn);
    const weaponAffixes = itemCatalog.rollWeaponAffixes(selectedItem, rarity, randomFn);
    const armorAffixes = itemCatalog.rollArmorAffixes(selectedItem, rarity, randomFn);
    const normalized = itemCatalog.normalizeEquipmentState(
      {
        entryId: `sim_${slotKey}`,
        itemId: selectedItem.id,
        slot: selectedItem.slot,
        socketsUnlocked: 0,
        insertedRunes: [],
        runewordId: "",
        rarity,
        rarityKind: itemCatalog.getRarityKind(rarity),
        rarityBonuses,
        weaponAffixes,
        armorAffixes,
      },
      slotKey === "ring1" || slotKey === "ring2" ? "ring" : slotKey,
      harness.content
    );
    if (normalized) {
      (run.loadout as Record<string, RunEquipmentState | null>)[slotKey] = normalized;
    }
  });

  harness.itemSystem.hydrateRunLoadout(run, harness.content);
  harness.itemSystem.hydrateRunInventory(run, harness.content, context.state.profile);
}

function scoreCard(card: CardDefinition | null | undefined) {
  if (!card) {
    return Number.NEGATIVE_INFINITY;
  }
  const effectScore = (card.effects || []).reduce((sum, effect) => {
    return sum + CARD_EFFECT_WEIGHTS[effect.kind] * Number(effect.value || 0);
  }, 0);
  const tierBonus = Number(card.tier || 1) * 3;
  const drawFlexBonus = card.target === "none" ? 1 : 0;
  return effectScore + tierBonus + drawFlexBonus - card.cost * 2.5;
}

function buildScenarioDeck(harness: ReturnType<typeof createAppHarness>, classId: string, scenario: BalanceScenarioDefinition) {
  const starterDeck = harness.classRegistry.getStarterDeckForClass(harness.content, classId);
  const profileId = harness.classRegistry.getDeckProfileId(harness.content, classId);
  const classPool = harness.content.classRewardPools?.[classId] || { early: [], mid: [], late: [] };
  const candidateIds = uniqueList([
    ...classPool.late,
    ...classPool.mid,
    ...classPool.early,
    ...(harness.content.rewardPools?.profileCards?.[profileId] || []),
    ...(harness.content.rewardPools?.bossCards || []),
  ]).filter((cardId) => !starterDeck.includes(cardId) && Boolean(harness.content.cardCatalog[cardId]));

  const ranked = candidateIds.sort((left, right) => {
    return scoreCard(harness.content.cardCatalog[right]) - scoreCard(harness.content.cardCatalog[left]);
  });
  const addedCards = ranked.slice(0, scenario.deckAdditions);
  return {
    deck: [...starterDeck, ...addedCards],
    addedCards,
  };
}

function allocateAttributePoints(run: RunState, scenario: BalanceScenarioDefinition) {
  const points = Math.max(0, Number(run.progression.attributePointsAvailable || 0));
  if (points <= 0) {
    return;
  }
  const allocated: Record<keyof RunAttributeState, number> = {
    strength: 0,
    dexterity: 0,
    vitality: 0,
    energy: 0,
  };
  const keys = Object.keys(scenario.attributeWeights) as Array<keyof RunAttributeState>;
  for (let pointIndex = 0; pointIndex < points; pointIndex += 1) {
    let bestKey = keys[0];
    let bestGap = Number.NEGATIVE_INFINITY;
    keys.forEach((key) => {
      const desired = scenario.attributeWeights[key] * (pointIndex + 1);
      const gap = desired - allocated[key];
      if (gap > bestGap) {
        bestGap = gap;
        bestKey = key;
      }
    });
    run.progression.attributes[bestKey] += 1;
    allocated[bestKey] += 1;
  }
  run.progression.attributePointsSpent += points;
  run.progression.attributePointsAvailable = 0;
}

function allocateClassPoints(harness: ReturnType<typeof createAppHarness>, run: RunState, deck: string[]) {
  const classProgression = harness.content.classProgressionCatalog?.[run.classId];
  if (!classProgression) {
    return;
  }
  const points = Math.max(0, Number(run.progression.classPointsAvailable || 0));
  if (points <= 0) {
    return;
  }

  const trees = classProgression.trees || [];
  const deckSkillIds = new Set(
    deck
      .map((cardId) => harness.content.cardCatalog[cardId]?.skillRef || "")
      .filter(Boolean)
  );
  const totalMaxRanks = trees.reduce((sum, tree) => sum + Math.max(1, Number(tree.maxRank || tree.skills.length || 1)), 0);
  const topTree =
    trees
      .map((tree) => ({
        treeId: tree.id,
        score: (tree.skills || []).filter((skill) => deckSkillIds.has(skill.id)).length,
      }))
      .sort((left, right) => right.score - left.score)[0]?.treeId || trees[0]?.id || "";

  if (points >= totalMaxRanks) {
    trees.forEach((tree) => {
      run.progression.classProgression.treeRanks[tree.id] = Math.max(1, Number(tree.maxRank || tree.skills.length || 1));
    });
    run.progression.classProgression.favoredTreeId = topTree;
    run.progression.classPointsSpent += totalMaxRanks;
    run.progression.classPointsAvailable = Math.max(0, points - totalMaxRanks);
    harness.browserWindow.ROUGE_RUN_PROGRESSION.syncUnlockedClassSkills(run, harness.content);
    return;
  }

  const treeWeights = trees.reduce((total, tree) => {
    total[tree.id] = Math.max(1, (tree.skills || []).filter((skill) => deckSkillIds.has(skill.id)).length);
    return total;
  }, {} as Record<string, number>);

  for (let index = 0; index < points; index += 1) {
    const nextTree = trees
      .filter((tree) => {
        const current = Number(run.progression.classProgression.treeRanks[tree.id] || 0);
        const maxRank = Math.max(1, Number(tree.maxRank || tree.skills.length || 1));
        return current < maxRank;
      })
      .sort((left, right) => {
        const leftScore = treeWeights[left.id] - Number(run.progression.classProgression.treeRanks[left.id] || 0) * 0.5;
        const rightScore = treeWeights[right.id] - Number(run.progression.classProgression.treeRanks[right.id] || 0) * 0.5;
        return rightScore - leftScore;
      })[0];
    if (!nextTree) {
      break;
    }
    run.progression.classProgression.treeRanks[nextTree.id] = Number(run.progression.classProgression.treeRanks[nextTree.id] || 0) + 1;
    run.progression.classProgression.favoredTreeId = nextTree.id;
    run.progression.classPointsSpent += 1;
    run.progression.classPointsAvailable = Math.max(0, run.progression.classPointsAvailable - 1);
  }

  harness.browserWindow.ROUGE_RUN_PROGRESSION.syncUnlockedClassSkills(run, harness.content);
}

function applyRewardPackage(context: SimulatedBuildContext) {
  const { harness, run, scenario } = context;
  const rewardPackage = scenario.rewardPackage;
  if (rewardPackage.heroMaxLife > 0) {
    run.hero.maxLife += rewardPackage.heroMaxLife;
    run.hero.currentLife = Math.min(run.hero.maxLife, run.hero.currentLife + rewardPackage.heroMaxLife);
  }
  if (rewardPackage.heroMaxEnergy > 0) {
    run.hero.maxEnergy = clamp(run.hero.maxEnergy + rewardPackage.heroMaxEnergy, 1, harness.browserWindow.ROUGE_LIMITS.MAX_HERO_ENERGY);
  }
  if (rewardPackage.heroPotionHeal > 0) {
    run.hero.potionHeal = clamp(run.hero.potionHeal + rewardPackage.heroPotionHeal, 1, harness.browserWindow.ROUGE_LIMITS.MAX_HERO_POTION_HEAL);
  }
  if (rewardPackage.mercenaryAttack > 0) {
    run.mercenary.attack += rewardPackage.mercenaryAttack;
  }
  if (rewardPackage.mercenaryMaxLife > 0) {
    run.mercenary.maxLife += rewardPackage.mercenaryMaxLife;
    run.mercenary.currentLife = Math.min(run.mercenary.maxLife, run.mercenary.currentLife + rewardPackage.mercenaryMaxLife);
  }
  run.belt.max = Math.max(run.belt.max, scenario.potionCount + rewardPackage.extraPotions);
  run.belt.current = run.belt.max;
}

function buildSimulatedRun(harness: ReturnType<typeof createAppHarness>, classId: string, scenario: BalanceScenarioDefinition): SimulatedBuildContext {
  const mercenaryId = getMercenaryIdForClass(classId);
  const state = harness.appEngine.createAppState({
    content: harness.content,
    seedBundle: harness.seedBundle,
    combatEngine: harness.combatEngine,
    randomFn: () => 0.5,
  });

  harness.appEngine.startCharacterSelect(state);
  harness.appEngine.setSelectedClass(state, classId);
  harness.appEngine.setSelectedMercenary(state, mercenaryId);
  harness.appEngine.startRun(state);

  const deckBundle = buildScenarioDeck(harness, classId, scenario);
  state.run.deck = [...deckBundle.deck];
  state.run.xp = Math.max(0, (scenario.targetLevel - 1) * 50);
  state.run.level = scenario.targetLevel;
  state.run.currentActIndex = clamp(scenario.actNumber - 1, 0, state.run.acts.length - 1);
  harness.browserWindow.ROUGE_RUN_ROUTE_BUILDER.syncCurrentActFields(state.run);
  harness.browserWindow.ROUGE_RUN_PROGRESSION.syncLevelProgression(state.run);
  allocateAttributePoints(state.run, scenario);
  allocateClassPoints(harness, state.run, deckBundle.deck);
  equipScenarioLoadout({
    harness,
    state,
    run: state.run,
    scenario,
    classId,
    className: state.run.className,
    mercenaryId,
    deck: deckBundle.deck,
    addedCards: deckBundle.addedCards,
  });
  applyRewardPackage({
    harness,
    state,
    run: state.run,
    scenario,
    classId,
    className: state.run.className,
    mercenaryId,
    deck: deckBundle.deck,
    addedCards: deckBundle.addedCards,
  });
  state.run.hero.currentLife = state.run.hero.maxLife;
  state.run.mercenary.currentLife = state.run.mercenary.maxLife;
  state.run.belt.current = Math.max(state.run.belt.current, scenario.potionCount);
  state.run.belt.max = Math.max(state.run.belt.max, scenario.potionCount);

  return {
    harness,
    state,
    run: state.run,
    scenario,
    classId,
    className: state.run.className,
    mercenaryId,
    deck: deckBundle.deck,
    addedCards: deckBundle.addedCards,
  };
}

function getEncounterEntries(context: SimulatedBuildContext, encounterSetId: string, encounterLimit = 0) {
  const act = context.run.acts[context.scenario.actNumber - 1];
  const entries = uniqueEncounterEntries(
    act.zones.flatMap((zone) => {
      return (zone.encounterIds || []).map((encounterId) => {
        const encounter = context.harness.content.encounterCatalog[encounterId];
        if (!encounter) {
          return null;
        }
        const hasBoss = encounter.enemies.some((enemy) => enemy.templateId.endsWith("_boss"));
        const hasMiniboss = zone.kind === "miniboss";
        const hasElite = !hasMiniboss && encounter.enemies.some((enemy) => enemy.templateId.includes("_elite"));
        const include =
          encounterSetId === "act5_bosses"
            ? zone.kind === "boss" || hasBoss
            : encounterSetId === "act5_unique_packs"
              ? zone.kind === "miniboss" || hasElite
              : encounterSetId === "act5_endgame"
                ? zone.kind === "boss" || zone.kind === "miniboss" || hasElite
                : zone.kind === "battle" || zone.kind === "miniboss" || zone.kind === "boss";
        if (!include) {
          return null;
        }
        return {
          encounterId,
          encounterName: encounter.name,
          zoneTitle: zone.title,
          zoneKind: zone.kind,
          hasBoss,
          hasMiniboss,
          hasElite,
        } as BalanceEncounterEntry;
      });
    })
  );

  const sorted = entries.sort((left, right) => {
    if (left.hasBoss !== right.hasBoss) {
      return left.hasBoss ? -1 : 1;
    }
    if (left.hasMiniboss !== right.hasMiniboss) {
      return left.hasMiniboss ? -1 : 1;
    }
    if (left.hasElite !== right.hasElite) {
      return left.hasElite ? -1 : 1;
    }
    return left.encounterId.localeCompare(right.encounterId);
  });
  return encounterLimit > 0 ? sorted.slice(0, encounterLimit) : sorted;
}

function uniqueEncounterEntries(entries: Array<BalanceEncounterEntry | null>) {
  const seen = new Set<string>();
  return entries.filter((entry): entry is BalanceEncounterEntry => {
    if (!entry || seen.has(entry.encounterId)) {
      return false;
    }
    seen.add(entry.encounterId);
    return true;
  });
}

function buildCombatStateForEncounter(context: SimulatedBuildContext, encounterId: string, seed: number) {
  const { harness, run, state } = context;
  const overrides = harness.runFactory.createCombatOverrides(run, harness.content, state.profile);
  const combatBonuses = harness.itemSystem.buildCombatBonuses(run, harness.content);
  const armorProfile = harness.itemSystem.buildCombatMitigationProfile(run, harness.content) || null;
  const weaponEquipment = run.loadout.weapon || null;
  const weaponItemId = weaponEquipment?.itemId || "";
  const weaponItem = harness.browserWindow.ROUGE_ITEM_CATALOG.getItemDefinition(harness.content, weaponItemId);
  const weaponProfile = harness.browserWindow.ROUGE_ITEM_CATALOG.buildEquipmentWeaponProfile(weaponEquipment, harness.content) || null;
  const weaponFamily = harness.browserWindow.ROUGE_ITEM_CATALOG.getWeaponFamily(weaponItemId, harness.content) || "";
  const classPreferredFamilies = harness.classRegistry.getPreferredWeaponFamilies(run.classId) || [];

  return harness.combatEngine.createCombatState({
    content: { ...harness.content, hero: overrides.heroState },
    encounterId,
    mercenaryId: run.mercenary.id,
    heroState: overrides.heroState,
    mercenaryState: overrides.mercenaryState,
    starterDeck: overrides.starterDeck,
    initialPotions: overrides.initialPotions,
    randomFn: createSeededRandom(seed),
    weaponFamily,
    weaponName: weaponItem?.name || "",
    weaponDamageBonus: Number(combatBonuses.heroDamageBonus || 0),
    weaponProfile,
    armorProfile,
    classPreferredFamilies,
  });
}

function cloneCombatState(state: CombatState) {
  const clone = JSON.parse(JSON.stringify(state)) as CombatState;
  clone.randomFn = state.randomFn;
  return clone;
}


function getHandValue(state: CombatState, content: GameContent) {
  return state.hand.reduce((sum, entry) => {
    return sum + Math.max(0, scoreCard(content.cardCatalog[entry.cardId]));
  }, 0);
}

function scoreCombatStateDelta(before: CombatState, after: CombatState, content: GameContent, actionType: CombatCandidateAction["type"]) {
  const beforeEnemyLife = before.enemies.reduce((sum, enemy) => sum + enemy.life, 0);
  const beforeEnemyGuard = before.enemies.reduce((sum, enemy) => sum + enemy.guard, 0);
  const afterEnemyLife = after.enemies.reduce((sum, enemy) => sum + enemy.life, 0);
  const afterEnemyGuard = after.enemies.reduce((sum, enemy) => sum + enemy.guard, 0);
  const beforeLivingEnemies = before.enemies.filter((enemy) => enemy.alive).length;
  const afterLivingEnemies = after.enemies.filter((enemy) => enemy.alive).length;
  const beforeThreat = getIncomingThreat(before);
  const afterThreat = getIncomingThreat(after);
  const beforeShortfall = Math.max(0, beforeThreat - (before.hero.life + before.hero.guard));
  const afterShortfall = Math.max(0, afterThreat - (after.hero.life + after.hero.guard));
  const beforePressure = getThreatPressure(before);
  const afterPressure = getThreatPressure(after);
  const chargeThreat = hasChargeThreat(before);

  let score =
    (beforeEnemyLife - afterEnemyLife) * 3.4 +
    (beforeEnemyGuard - afterEnemyGuard) * 1.0 +
    (before.hero.life - after.hero.life) * 0 +
    (after.hero.life - before.hero.life) * 2.4 +
    (after.hero.guard - before.hero.guard) * 1.8 +
    (after.mercenary.life - before.mercenary.life) * 1.0 +
    (after.mercenary.guard - before.mercenary.guard) * 0.8 +
    (beforeLivingEnemies - afterLivingEnemies) * 45 +
    (getEnemyStatusScore(after) - getEnemyStatusScore(before)) * 1.4 +
    (getHeroDebuffScore(before) - getHeroDebuffScore(after)) * 2.0 +
    (beforeShortfall - afterShortfall) * 5 +
    (beforePressure - afterPressure) * (chargeThreat ? 42 : 18) +
    (getHandValue(after, content) - getHandValue(before, content)) * 0.12;

  if (after.mercenary.markedEnemyId && !before.mercenary.markedEnemyId) {
    score += 6;
  }
  score += (after.mercenary.nextAttackBonus - before.mercenary.nextAttackBonus) * 2.5;
  score += (after.mercenary.markBonus - before.mercenary.markBonus) * 2.5;
  if (after.outcome === "victory") {
    score += 1000;
  }
  if (after.outcome === "defeat") {
    score -= 1000;
  }
  if (actionType === "potion") {
    score -= 5;
    if (before.hero.life <= beforeThreat || before.hero.life / Math.max(1, before.hero.maxLife) <= 0.35) {
      score += 18;
    }
    if (chargeThreat && beforePressure >= 0.55) {
      score += 12;
    }
    if ((before.hero.heroBurn + before.hero.heroPoison) >= 2 && before.hero.life / Math.max(1, before.hero.maxLife) <= 0.6) {
      score += 8;
    }
  }
  if (actionType === "end_turn") {
    score -= 2 + afterShortfall * 2;
    if (chargeThreat) {
      score -= 10 + afterPressure * 8;
    }
  }
  return score;
}

function listCandidateActions(state: CombatState, content: GameContent, engine: CombatEngineApi): CombatCandidateAction[] {
  const candidates: CombatCandidateAction[] = [];
  if (state.phase !== "player" || state.outcome) {
    return candidates;
  }

  state.hand.forEach((entry) => {
    const card = content.cardCatalog[entry.cardId];
    if (!card || card.cost > state.hero.energy) {
      return;
    }
    if (card.target === "enemy") {
      state.enemies.filter((enemy) => enemy.alive).forEach((enemy) => {
        candidates.push({
          type: "card",
          score: Number.NEGATIVE_INFINITY,
          instanceId: entry.instanceId,
          targetId: enemy.id,
          targetName: enemy.name,
        });
      });
      return;
    }
    candidates.push({
      type: "card",
      score: Number.NEGATIVE_INFINITY,
      instanceId: entry.instanceId,
    });
  });

  if (state.potions > 0) {
    if (state.hero.alive && state.hero.life < state.hero.maxLife) {
      candidates.push({ type: "potion", score: Number.NEGATIVE_INFINITY, potionTarget: "hero" });
    }
    if (state.mercenary.alive && state.mercenary.life < state.mercenary.maxLife) {
      candidates.push({ type: "potion", score: Number.NEGATIVE_INFINITY, potionTarget: "mercenary" });
    }
  }

  if (!state.meleeUsed && state.enemies.some((enemy) => enemy.alive)) {
    candidates.push({ type: "melee", score: Number.NEGATIVE_INFINITY });
  }

  candidates.push({ type: "end_turn", score: Number.NEGATIVE_INFINITY });
  return candidates.map((candidate) => scoreCandidateAction(candidate, state, content, engine));
}

function scoreCandidateAction(candidate: CombatCandidateAction, state: CombatState, content: GameContent, engine: CombatEngineApi) {
  if (candidate.type === "end_turn") {
    const clone = cloneCombatState(state);
    engine.endTurn(clone);
    return {
      ...candidate,
      score: scoreCombatStateDelta(state, clone, content, "end_turn"),
    };
  }

  const clone = cloneCombatState(state);
  let result: ActionResult = { ok: false, message: "Unknown action." };
  if (candidate.type === "card" && candidate.instanceId) {
    result = engine.playCard(clone, content, candidate.instanceId, candidate.targetId || "");
  } else if (candidate.type === "melee") {
    result = engine.meleeStrike(clone, content);
  } else if (candidate.type === "potion" && candidate.potionTarget) {
    result = engine.usePotion(clone, candidate.potionTarget);
  }

  if (!result.ok) {
    return {
      ...candidate,
      score: Number.NEGATIVE_INFINITY,
    };
  }

  return {
    ...candidate,
    score: scoreCombatStateDelta(state, clone, content, candidate.type),
  };
}

function chooseBestAction(state: CombatState, content: GameContent, engine: CombatEngineApi) {
  const candidates = listCandidateActions(state, content, engine).sort((left, right) => right.score - left.score);
  const best = candidates[0] || { type: "end_turn", score: 0 };
  if (!best || best.score < 1) {
    return { type: "end_turn", score: 0 } as CombatCandidateAction;
  }
  return best;
}

function executeAction(action: CombatCandidateAction, state: CombatState, content: GameContent, engine: CombatEngineApi) {
  if (action.type === "card" && action.instanceId) {
    return engine.playCard(state, content, action.instanceId, action.targetId || "");
  }
  if (action.type === "melee") {
    return engine.meleeStrike(state, content);
  }
  if (action.type === "potion" && action.potionTarget) {
    return engine.usePotion(state, action.potionTarget);
  }
  return engine.endTurn(state);
}

function simulateEncounter(context: SimulatedBuildContext, entry: BalanceEncounterEntry, runIndex: number) {
  const seed = hashString([context.classId, context.scenario.id, entry.encounterId, String(runIndex)].join("|"));
  const combatState = buildCombatStateForEncounter(context, entry.encounterId, seed);
  const actionLimitPerTurn = 32;

  while (!combatState.outcome && combatState.turn < context.scenario.maxTurns) {
    if (combatState.phase !== "player") {
      context.harness.combatEngine.endTurn(combatState);
      continue;
    }
    let actionsTaken = 0;
    while (combatState.phase === "player" && !combatState.outcome && actionsTaken < actionLimitPerTurn) {
      const action = chooseBestAction(combatState, context.harness.content, context.harness.combatEngine);
      const result = executeAction(action, combatState, context.harness.content, context.harness.combatEngine);
      actionsTaken += 1;
      if (!result.ok || action.type === "end_turn") {
        break;
      }
    }
    if (!combatState.outcome && combatState.phase === "player") {
      context.harness.combatEngine.endTurn(combatState);
    }
  }

  const remainingEnemyLife = combatState.enemies.reduce((sum, enemy) => sum + enemy.life, 0);
  const enemyMaxLife = combatState.enemies.reduce((sum, enemy) => sum + enemy.maxLife, 0);
  return {
    outcome: combatState.outcome || "timeout",
    turns: combatState.turn,
    heroLifePct: combatState.hero.maxLife > 0 ? combatState.hero.life / combatState.hero.maxLife : 0,
    mercenaryLifePct: combatState.mercenary.maxLife > 0 ? combatState.mercenary.life / combatState.mercenary.maxLife : 0,
    potionsRemaining: combatState.potions,
    enemyLifePct: enemyMaxLife > 0 ? remainingEnemyLife / enemyMaxLife : 0,
  };
}

function summarizeEncounterRuns(
  content: GameContent,
  entry: BalanceEncounterEntry,
  runs: ReturnType<typeof simulateEncounter>[]
): EncounterSimulationSummary {
  const wins = runs.filter((result) => result.outcome === "victory").length;
  const losses = runs.filter((result) => result.outcome === "defeat").length;
  const timeouts = runs.filter((result) => result.outcome === "timeout").length;
  const divisor = Math.max(1, runs.length);
  const enemyPowerScore = scoreEncounterPowerFromDefinition(content, entry.encounterId).total;
  return {
    encounterId: entry.encounterId,
    encounterName: entry.encounterName,
    zoneTitle: entry.zoneTitle,
    zoneKind: entry.zoneKind,
    kind: entry.hasBoss ? "boss" : entry.hasMiniboss ? "miniboss" : entry.hasElite ? "elite" : "battle",
    runs: runs.length,
    enemyPowerScore,
    powerDelta: 0,
    powerRatio: 0,
    winRate: wins / divisor,
    wins,
    losses,
    timeouts,
    averageTurns: roundTo(runs.reduce((sum, result) => sum + result.turns, 0) / divisor),
    averageHeroLifePct: roundTo((runs.reduce((sum, result) => sum + result.heroLifePct, 0) / divisor) * 100),
    averageMercenaryLifePct: roundTo((runs.reduce((sum, result) => sum + result.mercenaryLifePct, 0) / divisor) * 100),
    averagePotionsRemaining: roundTo(runs.reduce((sum, result) => sum + result.potionsRemaining, 0) / divisor),
    averageEnemyLifePct: roundTo((runs.reduce((sum, result) => sum + result.enemyLifePct, 0) / divisor) * 100),
    openingHandFullSpendRate: 0,
    averageTurn1UnspentEnergy: 0,
    averageEarlyUnspentEnergy: 0,
    averageEarlyMeaningfulUnplayedRate: 0,
    averageEarlyCandidateCount: 0,
    averageEarlyMeaningfulCandidateCount: 0,
    averageEarlyDecisionScoreSpread: 0,
    earlyCloseDecisionRate: 0,
    averageEarlyEndTurnRegret: 0,
  };
}

function buildSummary(context: SimulatedBuildContext): SimulationBuildSummary {
  const { harness, run, state } = context;
  const combatOverrides = harness.runFactory.createCombatOverrides(run, harness.content, state.profile);
  const armorProfile = harness.itemSystem.buildCombatMitigationProfile(run, harness.content);
  const weaponEquipment = run.loadout.weapon || null;
  const weaponItem = weaponEquipment ? harness.browserWindow.ROUGE_ITEM_CATALOG.getItemDefinition(harness.content, weaponEquipment.itemId) : null;
  const weaponProfile = harness.browserWindow.ROUGE_ITEM_CATALOG.buildEquipmentWeaponProfile(weaponEquipment, harness.content) || null;
  const partyPower = scorePartyPower({
    content: harness.content,
    deckCardIds: run.deck,
    heroState: {
      maxLife: combatOverrides.heroState.maxLife,
      maxEnergy: combatOverrides.heroState.maxEnergy,
      handSize: combatOverrides.heroState.handSize,
      potionHeal: combatOverrides.heroState.potionHeal,
      damageBonus: Number(combatOverrides.heroState.damageBonus || 0),
      guardBonus: Number(combatOverrides.heroState.guardBonus || 0),
      burnBonus: Number(combatOverrides.heroState.burnBonus || 0),
    },
    mercenaryState: {
      maxLife: combatOverrides.mercenaryState.maxLife,
      attack: combatOverrides.mercenaryState.attack,
    },
    weaponProfile,
    armorProfile,
    weaponFamily: weaponItem?.family || "",
    classPreferredFamilies: harness.classRegistry.getPreferredWeaponFamilies(run.classId) || [],
    gold: run.gold,
    potions: run.belt.current,
    level: run.level,
    bankedSkillPoints: Number(run.progression?.skillPointsAvailable || 0),
    bankedClassPoints: Number(run.progression?.classPointsAvailable || 0),
    bankedAttributePoints: Number(run.progression?.attributePointsAvailable || 0),
    includeCurrentResources: false,
  });
  const bossReadiness = scoreBossReadiness({
    content: harness.content,
    deckCardIds: run.deck,
    heroState: {
      maxLife: combatOverrides.heroState.maxLife,
      maxEnergy: combatOverrides.heroState.maxEnergy,
      handSize: combatOverrides.heroState.handSize,
      potionHeal: combatOverrides.heroState.potionHeal,
      damageBonus: Number(combatOverrides.heroState.damageBonus || 0),
      guardBonus: Number(combatOverrides.heroState.guardBonus || 0),
      burnBonus: Number(combatOverrides.heroState.burnBonus || 0),
    },
    mercenaryState: {
      maxLife: combatOverrides.mercenaryState.maxLife,
      attack: combatOverrides.mercenaryState.attack,
    },
    weaponProfile,
    armorProfile,
    weaponFamily: weaponItem?.family || "",
    classPreferredFamilies: harness.classRegistry.getPreferredWeaponFamilies(run.classId) || [],
    gold: run.gold,
    potions: run.belt.current,
    level: run.level,
    bankedSkillPoints: Number(run.progression?.skillPointsAvailable || 0),
    bankedClassPoints: Number(run.progression?.classPointsAvailable || 0),
    bankedAttributePoints: Number(run.progression?.attributePointsAvailable || 0),
    includeCurrentResources: false,
  });
  const bossAdjustedPower = scoreBossAdjustedPartyPower({
    content: harness.content,
    deckCardIds: run.deck,
    heroState: {
      maxLife: combatOverrides.heroState.maxLife,
      maxEnergy: combatOverrides.heroState.maxEnergy,
      handSize: combatOverrides.heroState.handSize,
      potionHeal: combatOverrides.heroState.potionHeal,
      damageBonus: Number(combatOverrides.heroState.damageBonus || 0),
      guardBonus: Number(combatOverrides.heroState.guardBonus || 0),
      burnBonus: Number(combatOverrides.heroState.burnBonus || 0),
    },
    mercenaryState: {
      maxLife: combatOverrides.mercenaryState.maxLife,
      attack: combatOverrides.mercenaryState.attack,
    },
    weaponProfile,
    armorProfile,
    weaponFamily: weaponItem?.family || "",
    classPreferredFamilies: harness.classRegistry.getPreferredWeaponFamilies(run.classId) || [],
    gold: run.gold,
    potions: run.belt.current,
    level: run.level,
    bankedSkillPoints: Number(run.progression?.skillPointsAvailable || 0),
    bankedClassPoints: Number(run.progression?.classPointsAvailable || 0),
    bankedAttributePoints: Number(run.progression?.attributePointsAvailable || 0),
    includeCurrentResources: false,
  });
  return {
    classId: context.classId,
    className: context.className,
    mercenaryId: context.mercenaryId,
    mercenaryName: run.mercenary.name,
    level: run.level,
    actNumber: context.scenario.actNumber,
    deckSize: run.deck.length,
    deckPreview: run.deck.slice(0, 8),
    addedCards: [...context.addedCards],
    potions: run.belt.current,
    powerScore: partyPower.total,
    bossReadinessScore: bossReadiness.total,
    bossAdjustedPowerScore: bossAdjustedPower.total,
    powerBreakdown: {
      offense: partyPower.offense,
      defense: partyPower.defense,
      sustain: partyPower.sustain,
      utility: partyPower.utility,
      deck: partyPower.deck,
      equipment: partyPower.equipment,
      progression: partyPower.progression,
      resources: partyPower.resources,
    },
    hero: {
      maxLife: combatOverrides.heroState.maxLife,
      maxEnergy: combatOverrides.heroState.maxEnergy,
      handSize: combatOverrides.heroState.handSize,
      potionHeal: combatOverrides.heroState.potionHeal,
      damageBonus: Number(combatOverrides.heroState.damageBonus || 0),
      guardBonus: Number(combatOverrides.heroState.guardBonus || 0),
      burnBonus: Number(combatOverrides.heroState.burnBonus || 0),
    },
    mercenary: {
      maxLife: combatOverrides.mercenaryState.maxLife,
      attack: combatOverrides.mercenaryState.attack,
    },
    weapon: weaponEquipment
      ? {
          itemId: weaponEquipment.itemId,
          name: weaponItem?.name || weaponEquipment.itemId,
          family: weaponItem?.family || "",
          rarity: weaponEquipment.rarity || "white",
        }
      : null,
    armorResistances: (armorProfile?.resistances || []).map((entry) => ({
      type: entry.type,
      amount: Number(entry.amount || 0),
    })),
    armorImmunities: [...(armorProfile?.immunities || [])],
    notes: [...context.scenario.notes],
  };
}

function buildScenarioReport(context: SimulatedBuildContext, encounterSetId: string, runsPerEncounter: number, encounterLimit = 0): ScenarioBalanceReport {
  const entries = getEncounterEntries(context, encounterSetId, encounterLimit);
  if (entries.length === 0) {
    throw new Error(`No encounters matched encounter set "${encounterSetId}" for Act ${context.scenario.actNumber}.`);
  }

  const build = buildSummary(context);
  const encounters = entries.map((entry) => {
    const runs = Array.from({ length: runsPerEncounter }, (_, index) => simulateEncounter(context, entry, index));
    const summary = summarizeEncounterRuns(context.harness.content, entry, runs);
    return {
      ...summary,
      kind: (entry.hasBoss ? "boss" : entry.hasMiniboss ? "miniboss" : entry.hasElite ? "elite" : "battle") as "boss" | "miniboss" | "elite" | "battle",
      runs: runsPerEncounter,
      powerDelta: roundTo(build.powerScore - summary.enemyPowerScore),
      powerRatio: roundTo(build.powerScore / Math.max(1, summary.enemyPowerScore)),
    };
  });

  const totalAttempts = Math.max(1, encounters.length * runsPerEncounter);
  const wins = encounters.reduce((sum, encounter) => sum + encounter.wins, 0);
  const losses = encounters.reduce((sum, encounter) => sum + encounter.losses, 0);
  const timeouts = encounters.reduce((sum, encounter) => sum + encounter.timeouts, 0);

  return {
    scenarioId: context.scenario.id,
    label: context.scenario.label,
    assumptions: [...context.scenario.notes],
    build,
    encounters,
    overall: {
      winRate: wins / totalAttempts,
      wins,
      losses,
      timeouts,
      averageTurns: roundTo(encounters.reduce((sum, encounter) => sum + encounter.averageTurns * runsPerEncounter, 0) / totalAttempts),
      averageHeroLifePct: roundTo(encounters.reduce((sum, encounter) => sum + encounter.averageHeroLifePct * runsPerEncounter, 0) / totalAttempts),
      averageMercenaryLifePct: roundTo(encounters.reduce((sum, encounter) => sum + encounter.averageMercenaryLifePct * runsPerEncounter, 0) / totalAttempts),
      averagePotionsRemaining: roundTo(encounters.reduce((sum, encounter) => sum + encounter.averagePotionsRemaining * runsPerEncounter, 0) / totalAttempts),
      averageEnemyLifePct: roundTo(encounters.reduce((sum, encounter) => sum + encounter.averageEnemyLifePct * runsPerEncounter, 0) / totalAttempts),
    },
  };
}

export function getBalanceScenarioDefinitions() {
  return Object.values(BALANCE_SCENARIOS).map((scenario) => ({ ...scenario }));
}

export function getBalanceEncounterSetLabels() {
  return { ...ENCOUNTER_SET_LABELS };
}

export function runBalanceSimulationReport(options: BalanceSimulationOptions = {}): BalanceSimulationReport {
  const encounterSetId = options.encounterSetId || "act5_endgame";
  if (!ENCOUNTER_SET_LABELS[encounterSetId]) {
    throw new Error(`Unknown encounter set: ${encounterSetId}`);
  }
  const runsPerEncounter = Math.max(1, options.runsPerEncounter || 16);
  const classIds = options.classIds && options.classIds.length > 0 ? options.classIds : [...DEFAULT_CLASS_IDS];
  const scenarios = getScenarioDefinitions(options.scenarioIds);
  const harness = createQuietAppHarness();

  const classReports = classIds.map((classId) => {
    const classDefinition = harness.classRegistry.getClassDefinition(harness.seedBundle, classId);
    if (!classDefinition) {
      throw new Error(`Unknown class: ${classId}`);
    }
    const scenarioReports = scenarios.map((scenario) => {
      const context = buildSimulatedRun(harness, classId, scenario);
      return buildScenarioReport(context, encounterSetId, runsPerEncounter, options.encounterLimit || 0);
    });
    return {
      classId,
      className: classDefinition.name,
      scenarios: scenarioReports,
    };
  });

  return {
    generatedAt: new Date().toISOString(),
    encounterSetId,
    encounterSetLabel: ENCOUNTER_SET_LABELS[encounterSetId],
    runsPerEncounter,
    classReports,
  };
}
