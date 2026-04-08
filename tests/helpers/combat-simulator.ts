import { createAppHarness } from "./browser-harness";
import {
  scoreArmorProfile,
  scoreBossAdjustedPartyPower,
  scoreBossReadiness,
  scoreEncounterPowerFromDefinition,
  scorePartyPower,
  scoreWeaponProfile,
} from "./balance-power-score";
import { ATTACK_INTENT_KINDS, SIMULATION_SCORING_WEIGHTS } from "./run-progression-simulator-core";
import { applySimulationTrainingLoadout } from "./run-progression-simulator";
import {
  getEnemyStatusScore,
  getHeroDebuffScore,
  getIncomingThreat,
  getIncomingThreatProfile,
  getThreatShortfall,
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
  training: {
    favoredTreeId: string;
    treeRanks: Record<string, number>;
    unlockedSkillIds: string[];
    equippedSkillIds: Record<RunSkillBarSlotKey, string>;
    equippedSkillNames: Record<RunSkillBarSlotKey, string>;
  };
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
  skillActionRate: number;
  skillUseTurnRate: number;
  readySkillUnusedTurnRate: number;
  slot1UseRate: number;
  slot2UseRate: number;
  slot3UseRate: number;
  beamDecisionRate: number;
  averageBeamDepth: number;
  beamOverrideRate: number;
  defeatCauses: Record<string, number>;
  averageLogEntries: number;
  averageEnemyActions: number;
  averageCardsPlayed: number;
  averageStatusEffects: number;
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
    beamDecisionRate?: number;
    averageBeamDepth?: number;
    beamOverrideRate?: number;
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

export interface CraftedCombatSimulationSpec {
  label?: string;
  classId: string;
  mercenaryId?: string;
  seed?: number;
  actNumber?: number;
  targetLevel?: number;
  maxTurns?: number;
  runsPerEncounter?: number;
  encounterId?: string;
  encounterIds?: string[];
  encounterSetId?: string;
  encounterLimit?: number;
  deckCardIds?: string[];
  addCardIds?: string[];
  favoredTreeId?: string;
  treeRanks?: Record<string, number>;
  unlockedSkillIds?: string[];
  equippedSkillIds?: Partial<Record<RunSkillBarSlotKey, string>>;
  bypassTrainingGates?: boolean;
  loadout?: Partial<Record<LoadoutSlotKey, string | Partial<RunEquipmentState>>>;
  potionCount?: number;
  gold?: number;
  heroOverrides?: {
    maxLife?: number;
    currentLife?: number;
    maxEnergy?: number;
    handSize?: number;
    potionHeal?: number;
    damageBonus?: number;
    guardBonus?: number;
    burnBonus?: number;
  };
  mercenaryOverrides?: {
    maxLife?: number;
    currentLife?: number;
    attack?: number;
  };
  notes?: string[];
}

export interface CraftedCombatSimulationReport {
  generatedAt: string;
  label: string;
  seed: number;
  encounterSource: {
    encounterIds: string[];
    encounterSetId: string;
    encounterSetLabel: string;
    runsPerEncounter: number;
  };
  requested: {
    classId: string;
    mercenaryId: string;
    actNumber: number;
    targetLevel: number;
    maxTurns: number;
    deckSize: number;
    favoredTreeId: string;
    treeRanks: Record<string, number>;
    equippedSkillIds: Partial<Record<RunSkillBarSlotKey, string>>;
    bypassTrainingGates: boolean;
  };
  build: SimulationBuildSummary;
  encounters: EncounterSimulationSummary[];
  overall: ScenarioBalanceReport["overall"];
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
  type: "card" | "skill" | "melee" | "potion" | "end_turn";
  score: number;
  instanceId?: string;
  slotKey?: RunSkillBarSlotKey;
  targetId?: string;
  targetName?: string;
  potionTarget?: "hero" | "mercenary";
  afterShortfall?: number;
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
  hyper_optimized: {
    id: "hyper_optimized",
    label: "Hyper-Optimized Ceiling",
    actNumber: 5,
    targetLevel: 65,
    deckAdditions: 12,
    potionCount: 6,
    maxTurns: 36,
    attributeWeights: {
      strength: 0.6,
      dexterity: 0.05,
      vitality: 0.2,
      energy: 0.15,
    },
    rewardPackage: {
      heroMaxLife: 40,
      heroMaxEnergy: 2,
      heroPotionHeal: 6,
      mercenaryAttack: 4,
      mercenaryMaxLife: 16,
      extraPotions: 2,
    },
    rarityBySlot: {
      weapon: "brown",
      armor: "brown",
      helm: "yellow",
      shield: "yellow",
      gloves: "yellow",
      boots: "yellow",
      belt: "yellow",
      ring: "yellow",
      amulet: "yellow",
    },
    uniqueSlots: ["weapon", "armor"],
    notes: [
      "Models the absolute ceiling: perfect luck, all side branches cleared, every boss boon taken.",
      "Uses 12 deck additions to simulate aggressive reward drafting and lane commitment.",
      "Two unique equipment drops, max reward package, aggressive attribute allocation.",
      "Use this to identify what the strongest possible builds look like and whether they break encounters.",
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

function getAllClassSkills(harness: ReturnType<typeof createAppHarness>, classId: string) {
  const progression = harness.classRegistry.getClassProgression(harness.content, classId) || null;
  return progression ? progression.trees.flatMap((tree: RuntimeClassTreeDefinition) => tree.skills) : [];
}

function buildTrainingSummary(harness: ReturnType<typeof createAppHarness>, run: RunState) {
  const allSkills = getAllClassSkills(harness, run.classId);
  const equippedSkillBar = run.progression?.classProgression?.equippedSkillBar || {
    slot1SkillId: "",
    slot2SkillId: "",
    slot3SkillId: "",
  };
  const slotSkillId = (slotKey: RunSkillBarSlotKey) => String(equippedSkillBar[`${slotKey}SkillId` as keyof RunEquippedSkillBarState] || "");
  const slotSkillName = (slotKey: RunSkillBarSlotKey) => {
    const skillId = slotSkillId(slotKey);
    return allSkills.find((skill: RuntimeClassSkillDefinition) => skill.id === skillId)?.name || "";
  };
  return {
    favoredTreeId: String(run.progression?.classProgression?.favoredTreeId || ""),
    treeRanks: { ...(run.progression?.classProgression?.treeRanks || {}) },
    unlockedSkillIds: [...(run.progression?.classProgression?.unlockedSkillIds || [])],
    equippedSkillIds: {
      slot1: slotSkillId("slot1"),
      slot2: slotSkillId("slot2"),
      slot3: slotSkillId("slot3"),
    },
    equippedSkillNames: {
      slot1: slotSkillName("slot1"),
      slot2: slotSkillName("slot2"),
      slot3: slotSkillName("slot3"),
    },
  };
}

function applyRunLevelAndAct(harness: ReturnType<typeof createAppHarness>, run: RunState, targetLevel: number, actNumber: number) {
  run.xp = Math.max(0, (targetLevel - 1) * 50);
  run.level = Math.max(1, targetLevel);
  run.currentActIndex = clamp(actNumber - 1, 0, run.acts.length - 1);
  harness.browserWindow.ROUGE_RUN_ROUTE_BUILDER.syncCurrentActFields(run);
  harness.browserWindow.ROUGE_RUN_PROGRESSION.syncLevelProgression(run);
}

function buildCraftedDeck(harness: ReturnType<typeof createAppHarness>, classId: string, spec: CraftedCombatSimulationSpec) {
  const starterDeck = harness.classRegistry.getStarterDeckForClass(harness.content, classId);
  const requestedDeck =
    Array.isArray(spec.deckCardIds) && spec.deckCardIds.length > 0
      ? spec.deckCardIds
      : [...starterDeck, ...((Array.isArray(spec.addCardIds) ? spec.addCardIds : []))];
  const deck = uniqueList(requestedDeck).map((cardId) => {
    if (!harness.content.cardCatalog[cardId]) {
      throw new Error(`Unknown crafted deck card: ${cardId}`);
    }
    return cardId;
  });
  if (deck.length === 0) {
    throw new Error(`Crafted combat seed for ${classId} produced an empty deck.`);
  }
  return {
    deck,
    addedCards: deck.filter((cardId) => !starterDeck.includes(cardId)),
  };
}

function applyCraftedTreeProgression(harness: ReturnType<typeof createAppHarness>, run: RunState, spec: CraftedCombatSimulationSpec) {
  const requestedTreeRanks = spec.treeRanks || {};
  const normalizedTreeRanks = Object.entries(requestedTreeRanks).reduce((result, [treeId, rank]) => {
    const parsed = Math.max(0, Number(rank || 0));
    if (parsed > 0) {
      result[treeId] = parsed;
    }
    return result;
  }, {} as Record<string, number>);

  run.progression.classProgression.treeRanks = normalizedTreeRanks;
  run.progression.classProgression.favoredTreeId = String(spec.favoredTreeId || run.progression.classProgression.favoredTreeId || "");
  run.progression.classPointsSpent = Object.values(normalizedTreeRanks).reduce((sum, rank) => sum + Number(rank || 0), 0);
  run.progression.classPointsAvailable = 0;
  harness.browserWindow.ROUGE_RUN_PROGRESSION.syncUnlockedClassSkills(run, harness.content);
}

function validateCraftedSkillIds(harness: ReturnType<typeof createAppHarness>, classId: string, skillIds: string[]) {
  const allSkillIds = new Set(getAllClassSkills(harness, classId).map((skill: RuntimeClassSkillDefinition) => skill.id));
  skillIds.filter(Boolean).forEach((skillId) => {
    if (!allSkillIds.has(skillId)) {
      throw new Error(`Unknown crafted skill for ${classId}: ${skillId}`);
    }
  });
}

function applyCraftedTraining(harness: ReturnType<typeof createAppHarness>, state: AppState, spec: CraftedCombatSimulationSpec) {
  if (!state.run) {
    return;
  }
  const requestedSkillIds = uniqueList([
    ...(Array.isArray(spec.unlockedSkillIds) ? spec.unlockedSkillIds : []),
    ...Object.values(spec.equippedSkillIds || {}),
  ].filter(Boolean));
  validateCraftedSkillIds(harness, state.run.classId, requestedSkillIds);

  const requestedLoadout = {
    favoredTreeId: String(spec.favoredTreeId || ""),
    unlockedSkillIds: requestedSkillIds,
    equippedSkillIds: {
      slot2: String(spec.equippedSkillIds?.slot2 || ""),
      slot3: String(spec.equippedSkillIds?.slot3 || ""),
    },
  };

  applySimulationTrainingLoadout(harness as ReturnType<typeof import("./run-progression-simulator").createQuietAppHarness>, state, requestedLoadout);

  if (spec.bypassTrainingGates === false) {
    if (spec.equippedSkillIds?.slot1) {
      state.run.progression.classProgression.unlockedSkillIds = uniqueList([
        ...(state.run.progression.classProgression.unlockedSkillIds || []),
        spec.equippedSkillIds.slot1,
      ]);
      state.run.progression.classProgression.equippedSkillBar.slot1SkillId = spec.equippedSkillIds.slot1;
    }
    return;
  }

  state.run.progression.classProgression.unlockedSkillIds = uniqueList([
    ...(state.run.progression.classProgression.unlockedSkillIds || []),
    ...requestedSkillIds,
  ]);
  if (spec.favoredTreeId) {
    state.run.progression.classProgression.favoredTreeId = spec.favoredTreeId;
  }
  (["slot1", "slot2", "slot3"] as RunSkillBarSlotKey[]).forEach((slotKey) => {
    const skillId = String(spec.equippedSkillIds?.[slotKey] || "");
    if (skillId) {
      state.run!.progression.classProgression.equippedSkillBar[`${slotKey}SkillId` as keyof RunEquippedSkillBarState] = skillId;
    }
  });
}

function applyCraftedLoadout(context: SimulatedBuildContext, spec: CraftedCombatSimulationSpec) {
  const loadout = spec.loadout || {};
  const itemCatalog = context.harness.browserWindow.ROUGE_ITEM_CATALOG;
  let changed = false;
  (Object.keys(loadout) as LoadoutSlotKey[]).forEach((slotKey) => {
    const raw = loadout[slotKey];
    if (!raw) {
      return;
    }
    const normalizedSlot = slotKey === "ring1" || slotKey === "ring2" ? "ring" : slotKey;
    const rawValue: Record<string, unknown> =
      typeof raw === "string"
        ? {
            entryId: `crafted_${slotKey}`,
            itemId: raw,
            slot: normalizedSlot,
            socketsUnlocked: 0,
            insertedRunes: [],
            runewordId: "",
            rarity: "white",
            rarityKind: itemCatalog.getRarityKind("white"),
            rarityBonuses: [],
            weaponAffixes: [],
            armorAffixes: [],
          }
        : {
            entryId: `crafted_${slotKey}`,
            slot: normalizedSlot,
            socketsUnlocked: 0,
            insertedRunes: [],
            runewordId: "",
            rarity: "white",
            rarityKind: itemCatalog.getRarityKind(String(raw.rarity || "white")),
            rarityBonuses: [],
            weaponAffixes: [],
            armorAffixes: [],
            ...raw,
          };
    const rawItemId = String(rawValue.itemId || "");
    if (!rawItemId || !context.harness.content.itemCatalog?.[rawItemId]) {
      throw new Error(`Unknown crafted loadout item for ${slotKey}: ${rawItemId}`);
    }
    const normalized = itemCatalog.normalizeEquipmentState(rawValue, normalizedSlot, context.harness.content);
    if (!normalized) {
      throw new Error(`Could not normalize crafted loadout for ${slotKey}.`);
    }
    (context.run.loadout as Record<string, RunEquipmentState | null>)[slotKey] = normalized;
    changed = true;
  });
  if (changed) {
    context.harness.itemSystem.hydrateRunLoadout(context.run, context.harness.content);
    context.harness.itemSystem.hydrateRunInventory(context.run, context.harness.content, context.state.profile);
  }
}

function applyCraftedStatOverrides(context: SimulatedBuildContext, spec: CraftedCombatSimulationSpec) {
  const { run } = context;
  if (Number.isFinite(Number(spec.gold))) {
    run.gold = Math.max(0, Number(spec.gold || 0));
  }
  if (Number.isFinite(Number(spec.potionCount))) {
    run.belt.max = Math.max(0, Number(spec.potionCount || 0));
    run.belt.current = run.belt.max;
  }
  if (spec.heroOverrides) {
    const hero = spec.heroOverrides;
    if (Number.isFinite(Number(hero.maxLife))) {
      run.hero.maxLife = Math.max(1, Number(hero.maxLife || 0));
    }
    if (Number.isFinite(Number(hero.maxEnergy))) {
      run.hero.maxEnergy = Math.max(1, Number(hero.maxEnergy || 0));
    }
    if (Number.isFinite(Number(hero.handSize))) {
      run.hero.handSize = Math.max(1, Number(hero.handSize || 0));
    }
    if (Number.isFinite(Number(hero.potionHeal))) {
      run.hero.potionHeal = Math.max(1, Number(hero.potionHeal || 0));
    }
    if (Number.isFinite(Number(hero.damageBonus))) {
      run.hero.damageBonus = Number(hero.damageBonus || 0);
    }
    if (Number.isFinite(Number(hero.guardBonus))) {
      run.hero.guardBonus = Number(hero.guardBonus || 0);
    }
    if (Number.isFinite(Number(hero.burnBonus))) {
      run.hero.burnBonus = Number(hero.burnBonus || 0);
    }
    run.hero.currentLife = Number.isFinite(Number(hero.currentLife))
      ? Math.min(run.hero.maxLife, Math.max(1, Number(hero.currentLife || 0)))
      : run.hero.maxLife;
  } else {
    run.hero.currentLife = run.hero.maxLife;
  }

  if (spec.mercenaryOverrides) {
    const mercenary = spec.mercenaryOverrides;
    if (Number.isFinite(Number(mercenary.maxLife))) {
      run.mercenary.maxLife = Math.max(1, Number(mercenary.maxLife || 0));
    }
    if (Number.isFinite(Number(mercenary.attack))) {
      run.mercenary.attack = Math.max(0, Number(mercenary.attack || 0));
    }
    run.mercenary.currentLife = Number.isFinite(Number(mercenary.currentLife))
      ? Math.min(run.mercenary.maxLife, Math.max(1, Number(mercenary.currentLife || 0)))
      : run.mercenary.maxLife;
  } else {
    run.mercenary.currentLife = run.mercenary.maxLife;
  }
}

function buildEncounterEntryById(context: SimulatedBuildContext, encounterId: string): BalanceEncounterEntry {
  const encounter = context.harness.content.encounterCatalog[encounterId];
  if (!encounter) {
    throw new Error(`Unknown encounter: ${encounterId}`);
  }
  let matchedZone: ZoneState | null = null;
  context.run.acts.some((act) => {
    return act.zones.some((zone) => {
      if ((zone.encounterIds || []).includes(encounterId)) {
        matchedZone = zone;
        return true;
      }
      return false;
    });
  });
  const hasBoss = encounter.enemies.some((enemy) => enemy.templateId.endsWith("_boss"));
  const hasMiniboss = matchedZone?.kind === "miniboss";
  const hasElite = !hasMiniboss && encounter.enemies.some((enemy) => enemy.templateId.includes("_elite"));
  return {
    encounterId,
    encounterName: encounter.name,
    zoneTitle: matchedZone?.title || `Act ${context.run.actNumber} Encounter`,
    zoneKind: matchedZone?.kind || (hasBoss ? "boss" : hasMiniboss ? "miniboss" : "battle"),
    hasBoss,
    hasMiniboss: Boolean(hasMiniboss),
    hasElite,
  };
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

  // Draft with offense/defense balance: ~60% offense, ~40% defense
  // A pure score-ranked draft produces all-offense decks that can't survive.
  const isDefensiveCard = (cardId: string) => {
    const card = harness.content.cardCatalog[cardId];
    if (!card) return false;
    const hasGuard = (card.effects || []).some((e: CardEffect) => e.kind === "gain_guard_self" || e.kind === "gain_guard_party");
    const hasHeal = (card.effects || []).some((e: CardEffect) => e.kind === "heal_hero" || e.kind === "heal_mercenary");
    const hasDamage = (card.effects || []).some((e: CardEffect) => e.kind === "damage" || e.kind === "damage_all");
    return (hasGuard || hasHeal) && !hasDamage;
  };

  const offenseCandidates = candidateIds.filter((id) => !isDefensiveCard(id))
    .sort((left, right) => scoreCard(harness.content.cardCatalog[right]) - scoreCard(harness.content.cardCatalog[left]));
  const defenseCandidates = candidateIds.filter((id) => isDefensiveCard(id))
    .sort((left, right) => scoreCard(harness.content.cardCatalog[right]) - scoreCard(harness.content.cardCatalog[left]));

  const targetDefense = Math.max(2, Math.floor(scenario.deckAdditions * 0.35));
  const targetOffense = scenario.deckAdditions - targetDefense;

  const addedCards = [
    ...offenseCandidates.slice(0, targetOffense),
    ...defenseCandidates.slice(0, targetDefense),
  ];

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
  applyRunLevelAndAct(harness, state.run, scenario.targetLevel, scenario.actNumber);
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
  const classProgression = harness.classRegistry.getClassProgression(harness.content, run.classId) || null;
  const overrides = harness.runFactory.createCombatOverrides(run, harness.content, state.profile);
  const combatBonuses = harness.itemSystem.buildCombatBonuses(run, harness.content);
  const armorProfile = harness.itemSystem.buildCombatMitigationProfile(run, harness.content) || null;
  const weaponEquipment = run.loadout.weapon || null;
  const weaponItemId = weaponEquipment?.itemId || "";
  const weaponItem = harness.browserWindow.ROUGE_ITEM_CATALOG.getItemDefinition(harness.content, weaponItemId);
  const weaponProfile = harness.browserWindow.ROUGE_ITEM_CATALOG.buildEquipmentWeaponProfile(weaponEquipment, harness.content) || null;
  const weaponFamily = harness.browserWindow.ROUGE_ITEM_CATALOG.getWeaponFamily(weaponItemId, harness.content) || "";
  const classPreferredFamilies = harness.classRegistry.getPreferredWeaponFamilies(run.classId) || [];
  const allSkills = classProgression ? classProgression.trees.flatMap((tree: RuntimeClassTreeDefinition) => tree.skills) : [];
  const equippedSkillBar = run.progression?.classProgression?.equippedSkillBar || {
    slot1SkillId: "",
    slot2SkillId: "",
    slot3SkillId: "",
  };
  const equippedSkills = (["slot1", "slot2", "slot3"] as RunSkillBarSlotKey[])
    .map((slotKey) => {
      const skillId = equippedSkillBar[`${slotKey}SkillId` as keyof RunEquippedSkillBarState] || "";
      const skill = allSkills.find((entry: RuntimeClassSkillDefinition) => entry.id === skillId) || null;
      return skill ? { slotKey, skill } : null;
    })
    .filter(Boolean) as CombatSkillLoadoutEntry[];

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
    equippedSkills,
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
  const beforeThreatProfile = getIncomingThreatProfile(before);
  const afterThreatProfile = getIncomingThreatProfile(after);
  const beforeBypassRatio = beforeThreatProfile.totalThreat > 0 ? beforeThreatProfile.bypassGuardThreat / beforeThreatProfile.totalThreat : 0;
  const afterBypassRatio = afterThreatProfile.totalThreat > 0 ? afterThreatProfile.bypassGuardThreat / afterThreatProfile.totalThreat : 0;
  const guardValueFactor = Math.max(0.15, 1 - Math.max(beforeBypassRatio, afterBypassRatio));
  const beforeEnemyLife = before.enemies.reduce((sum, enemy) => sum + enemy.life, 0);
  const beforeEnemyGuard = before.enemies.reduce((sum, enemy) => sum + enemy.guard, 0);
  const afterEnemyLife = after.enemies.reduce((sum, enemy) => sum + enemy.life, 0);
  const afterEnemyGuard = after.enemies.reduce((sum, enemy) => sum + enemy.guard, 0);
  const beforeLivingEnemies = before.enemies.filter((enemy) => enemy.alive).length;
  const afterLivingEnemies = after.enemies.filter((enemy) => enemy.alive).length;
  const _beforeThreat = getIncomingThreat(before);
  const _afterThreat = getIncomingThreat(after);
  const beforeShortfall = getThreatShortfall(before);
  const afterShortfall = getThreatShortfall(after);
  const beforePressure = getThreatPressure(before);
  const afterPressure = getThreatPressure(after);
  const chargeThreat = hasChargeThreat(before);
  const underImmediateThreat = beforeShortfall > 0 || (chargeThreat && beforePressure >= 0.55);
  const shortfallWeight = underImmediateThreat ? (chargeThreat ? 22 : 12) : (chargeThreat ? 14 : 7);

  // Intent-aware defense: compute exact incoming damage and scale guard/heal value proportionally
  const heroHpRatio = before.hero.maxLife > 0 ? before.hero.life / before.hero.maxLife : 1;
  const survivalUrgency = heroHpRatio < 0.3 ? 2.5 : heroHpRatio < 0.5 ? 1.8 : heroHpRatio < 0.7 ? 1.3 : 1.0;
  const incomingThreat = _beforeThreat;
  const guardGap = Math.max(0, incomingThreat - before.hero.guard);
  const guardSurplus = Math.max(0, before.hero.guard - incomingThreat);
  const guardUrgency = guardGap > 0 ? 1.5 + Math.min(1.5, guardGap / Math.max(1, before.hero.maxLife) * 3) : Math.max(0.4, 1 - guardSurplus * 0.06);
  const wouldBeLethal = incomingThreat > before.hero.guard + before.hero.life;
  const afterSurvivesLethal = wouldBeLethal && (incomingThreat <= after.hero.guard + after.hero.life);

  // Kill-removes-threat: killing an enemy removes its incoming intent damage
  const killedEnemyThreatRemoved = before.enemies.reduce((sum, enemy) => {
    if (!enemy.alive) { return sum; }
    const afterEnemy = after.enemies.find((e) => e.id === enemy.id);
    if (afterEnemy && !afterEnemy.alive && enemy.currentIntent) {
      const intentValue = Number(enemy.currentIntent.value || 0);
      if (ATTACK_INTENT_KINDS.has(enemy.currentIntent.kind)) { return sum + intentValue; }
      if (enemy.currentIntent.kind === "charge") { return sum + intentValue; }
    }
    return sum;
  }, 0);

  let score =
    (beforeEnemyLife - afterEnemyLife) * 3.0 +
    (beforeEnemyGuard - afterEnemyGuard) * 1.0 +
    (after.hero.life - before.hero.life) * (2.5 * survivalUrgency) +
    (after.hero.guard - before.hero.guard) * (2.2 + 0.3) * guardValueFactor * guardUrgency +
    (after.mercenary.life - before.mercenary.life) * 1.8 +
    (after.mercenary.guard - before.mercenary.guard) * 1.2 * guardValueFactor +
    (beforeLivingEnemies - afterLivingEnemies) * 45 +
    killedEnemyThreatRemoved * 3.5 +
    (getEnemyStatusScore(after) - getEnemyStatusScore(before)) * 1.2 +
    (getHeroDebuffScore(before) - getHeroDebuffScore(after)) * 2.0 +
    (beforeShortfall - afterShortfall) * shortfallWeight +
    (beforePressure - afterPressure) * (chargeThreat ? 42 : 18) +
    (getHandValue(after, content) - getHandValue(before, content)) * 0.12;

  if (afterSurvivesLethal) {
    score += 80;
  }

  if (beforeShortfall > 0 && afterShortfall <= 0) {
    score += chargeThreat ? 90 : 45;
  }
  if (beforeShortfall <= 0 && afterShortfall > 0) {
    score -= chargeThreat ? 100 : 50;
  }
  if (beforeShortfall > 0 && afterShortfall > 0) {
    score += (beforeShortfall - afterShortfall) * (chargeThreat ? 18 : 10);
  }
  if (chargeThreat && after.hero.guard > before.hero.guard && afterShortfall < beforeShortfall) {
    score += 18;
  }
  if (afterThreatProfile.bypassGuardThreat > beforeThreatProfile.bypassGuardThreat) {
    score -= (afterThreatProfile.bypassGuardThreat - beforeThreatProfile.bypassGuardThreat) * 0.9;
  }
  if (afterThreatProfile.bypassGuardThreat > 0 && after.hero.life < before.hero.life) {
    score -= (before.hero.life - after.hero.life) * 1.4;
  }

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
    if (wouldBeLethal) {
      score += 30;
    }
    if ((before.hero.heroBurn + before.hero.heroPoison) >= 2 && heroHpRatio <= 0.6) {
      score += 8;
    }
  }
  if (actionType === "end_turn") {
    score -= 2 + afterShortfall * (underImmediateThreat ? 5 : 2);
    if (chargeThreat) {
      score -= 10 + afterPressure * 8;
    }
    if (afterShortfall > 0) {
      score -= chargeThreat ? 40 : 18;
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

  state.equippedSkills
    .filter((skill) => {
      return (
        skill.active &&
        state.hero.energy >= skill.cost &&
        skill.remainingCooldown <= 0 &&
        (!skill.oncePerBattle || !skill.usedThisBattle) &&
        (skill.chargeCount <= 0 || skill.chargesRemaining > 0)
      );
    })
    .forEach((skill) => {
      const wantsTarget = skill.skillType === "attack" || skill.skillType === "spell" || skill.skillType === "debuff";
      if (wantsTarget) {
        state.enemies.filter((enemy) => enemy.alive).slice(0, 3).forEach((enemy) => {
          candidates.push({
            type: "skill",
            score: Number.NEGATIVE_INFINITY,
            slotKey: skill.slotKey,
            targetId: enemy.id,
            targetName: enemy.name,
          });
        });
        return;
      }
      candidates.push({
        type: "skill",
        score: Number.NEGATIVE_INFINITY,
        slotKey: skill.slotKey,
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
    const afterShortfall = getThreatShortfall(clone);
    return {
      ...candidate,
      afterShortfall,
      score: scoreCombatStateDelta(state, clone, content, "end_turn"),
    };
  }

  const clone = cloneCombatState(state);
  let result: ActionResult = { ok: false, message: "Unknown action." };
  if (candidate.type === "card" && candidate.instanceId) {
    result = engine.playCard(clone, content, candidate.instanceId, candidate.targetId || "");
  } else if (candidate.type === "skill" && candidate.slotKey) {
    result = engine.useSkill(clone, candidate.slotKey, candidate.targetId || "");
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

  const afterShortfall = getThreatShortfall(clone);

  return {
    ...candidate,
    afterShortfall,
    score: scoreCombatStateDelta(state, clone, content, candidate.type),
  };
}

function chooseBestAction(state: CombatState, content: GameContent, engine: CombatEngineApi) {
  const candidates = listCandidateActions(state, content, engine).sort((left, right) => right.score - left.score);
  const best = candidates[0] || { type: "end_turn", score: 0 };
  const currentShortfall = getThreatShortfall(state);
  const bestActiveCandidate = candidates.find((candidate) => candidate.type !== "end_turn") || null;
  const bestThreatReducer =
    currentShortfall > 0
      ? candidates
          .filter((candidate) => candidate.type !== "end_turn" && Number.isFinite(Number(candidate.afterShortfall)))
          .sort((left, right) => {
            const shortfallDelta =
              Number(left.afterShortfall ?? Number.POSITIVE_INFINITY) - Number(right.afterShortfall ?? Number.POSITIVE_INFINITY);
            if (shortfallDelta !== 0) {
              return shortfallDelta;
            }
            return Number(right.score) - Number(left.score);
          })[0] || null
      : null;
  if (currentShortfall > 0 && bestThreatReducer && Number(bestThreatReducer.afterShortfall ?? Number.POSITIVE_INFINITY) < currentShortfall) {
    return bestThreatReducer;
  }
  // Play any action that scores higher than end_turn
  const endTurnCandidate = candidates.find((candidate) => candidate.type === "end_turn");
  const endTurnScore = Number(endTurnCandidate?.score ?? Number.NEGATIVE_INFINITY);
  if (!best || !bestActiveCandidate || bestActiveCandidate.score <= endTurnScore) {
    return endTurnCandidate || ({ type: "end_turn", score: 0 } as CombatCandidateAction);
  }
  return best;
}

function executeAction(action: CombatCandidateAction, state: CombatState, content: GameContent, engine: CombatEngineApi) {
  if (action.type === "card" && action.instanceId) {
    return engine.playCard(state, content, action.instanceId, action.targetId || "");
  }
  if (action.type === "skill" && action.slotKey) {
    return engine.useSkill(state, action.slotKey, action.targetId || "");
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
  const logSummary = context.harness.browserWindow.__ROUGE_COMBAT_LOG.summarizeCombatLog(combatState);
  return {
    outcome: combatState.outcome || "timeout",
    turns: combatState.turn,
    heroLifePct: combatState.hero.maxLife > 0 ? combatState.hero.life / combatState.hero.maxLife : 0,
    mercenaryLifePct: combatState.mercenary.maxLife > 0 ? combatState.mercenary.life / combatState.mercenary.maxLife : 0,
    potionsRemaining: combatState.potions,
    enemyLifePct: enemyMaxLife > 0 ? remainingEnemyLife / enemyMaxLife : 0,
    logSummary,
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
    skillActionRate: 0,
    skillUseTurnRate: 0,
    readySkillUnusedTurnRate: 0,
    slot1UseRate: 0,
    slot2UseRate: 0,
    slot3UseRate: 0,
    beamDecisionRate: 0,
    averageBeamDepth: 0,
    beamOverrideRate: 0,
    defeatCauses: aggregateDefeatCauses(runs),
    averageLogEntries: roundTo(runs.reduce((sum, result) => sum + result.logSummary.totalEntries, 0) / divisor),
    averageEnemyActions: roundTo(runs.reduce((sum, result) => sum + result.logSummary.enemyActions, 0) / divisor),
    averageCardsPlayed: roundTo(runs.reduce((sum, result) => sum + result.logSummary.cardsPlayed, 0) / divisor),
    averageStatusEffects: roundTo(runs.reduce((sum, result) => sum + result.logSummary.statusEffects, 0) / divisor),
  };
}

function aggregateDefeatCauses(runs: ReturnType<typeof simulateEncounter>[]): Record<string, number> {
  const causes: Record<string, number> = {};
  for (const run of runs) {
    const cause = run.logSummary.defeatCause;
    if (cause) {
      causes[cause] = (causes[cause] || 0) + 1;
    }
  }
  return causes;
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
    training: buildTrainingSummary(harness, run),
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

function buildCraftedRun(spec: CraftedCombatSimulationSpec): SimulatedBuildContext {
  const harness = createQuietAppHarness();
  const classDefinition = harness.classRegistry.getClassDefinition(harness.seedBundle, spec.classId);
  if (!classDefinition) {
    throw new Error(`Unknown class: ${spec.classId}`);
  }
  const mercenaryId = String(spec.mercenaryId || getMercenaryIdForClass(spec.classId));
  const seed = Number.isFinite(Number(spec.seed)) ? Number(spec.seed) : hashString([spec.classId, spec.label || "crafted_combat"].join("|"));
  const actNumber = clamp(Number(spec.actNumber || 5), 1, 5);
  const targetLevel = Math.max(1, Number(spec.targetLevel || 35));
  const maxTurns = Math.max(1, Number(spec.maxTurns || 36));
  const deckBundle = buildCraftedDeck(harness, spec.classId, spec);
  const scenario: BalanceScenarioDefinition = {
    id: "crafted_seed",
    label: String(spec.label || `${classDefinition.name} crafted combat seed`),
    actNumber,
    targetLevel,
    deckAdditions: deckBundle.addedCards.length,
    potionCount: Math.max(0, Number(spec.potionCount ?? 3)),
    maxTurns,
    attributeWeights: {
      strength: 0.25,
      dexterity: 0.25,
      vitality: 0.25,
      energy: 0.25,
    },
    rewardPackage: {
      heroMaxLife: 0,
      heroMaxEnergy: 0,
      heroPotionHeal: 0,
      mercenaryAttack: 0,
      mercenaryMaxLife: 0,
      extraPotions: 0,
    },
    rarityBySlot: {},
    uniqueSlots: [],
    notes: [...(spec.notes || []), `Crafted combat seed ${seed}`],
  };

  const state = harness.appEngine.createAppState({
    content: harness.content,
    seedBundle: harness.seedBundle,
    combatEngine: harness.combatEngine,
    randomFn: createSeededRandom(seed),
  });
  harness.appEngine.startCharacterSelect(state);
  harness.appEngine.setSelectedClass(state, spec.classId);
  harness.appEngine.setSelectedMercenary(state, mercenaryId);
  const startResult = harness.appEngine.startRun(state);
  if (!startResult.ok || !state.run) {
    throw new Error(startResult.message || `Could not start crafted run for class ${spec.classId}.`);
  }

  state.run.seed = seed;
  state.run.deck = [...deckBundle.deck];
  applyRunLevelAndAct(harness, state.run, targetLevel, actNumber);
  applyCraftedTreeProgression(harness, state.run, spec);
  applyCraftedTraining(harness, state, spec);

  const context: SimulatedBuildContext = {
    harness,
    state,
    run: state.run,
    scenario,
    classId: spec.classId,
    className: classDefinition.name,
    mercenaryId,
    deck: deckBundle.deck,
    addedCards: deckBundle.addedCards,
  };

  applyCraftedLoadout(context, spec);
  applyCraftedStatOverrides(context, spec);
  return context;
}

function getCraftedEncounterEntries(context: SimulatedBuildContext, spec: CraftedCombatSimulationSpec) {
  const directEncounterIds = uniqueList([
    ...(spec.encounterId ? [spec.encounterId] : []),
    ...(Array.isArray(spec.encounterIds) ? spec.encounterIds : []),
  ]);
  if (directEncounterIds.length > 0) {
    return directEncounterIds.map((encounterId) => buildEncounterEntryById(context, encounterId));
  }
  const encounterSetId = String(spec.encounterSetId || "act5_endgame");
  return getEncounterEntries(context, encounterSetId, Math.max(0, Number(spec.encounterLimit || 0)));
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

export function runCraftedCombatSimulationReport(spec: CraftedCombatSimulationSpec): CraftedCombatSimulationReport {
  const context = buildCraftedRun(spec);
  const build = buildSummary(context);
  const encounterEntries = getCraftedEncounterEntries(context, spec);
  if (encounterEntries.length === 0) {
    throw new Error("Crafted combat seed did not resolve any encounters.");
  }
  const runsPerEncounter = Math.max(1, Number(spec.runsPerEncounter || 1));
  const encounters = encounterEntries.map((entry) => {
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
  const resolvedEncounterIds = encounterEntries.map((entry) => entry.encounterId);
  const encounterSetId = String(spec.encounterSetId || (resolvedEncounterIds.length === 1 ? resolvedEncounterIds[0] : "crafted_selection"));
  const encounterSetLabel = ENCOUNTER_SET_LABELS[encounterSetId] || (resolvedEncounterIds.length === 1 ? encounterEntries[0].encounterName : "Crafted Selection");

  return {
    generatedAt: new Date().toISOString(),
    label: String(spec.label || `${context.className} crafted combat seed`),
    seed: Number(context.run.seed || 0),
    encounterSource: {
      encounterIds: resolvedEncounterIds,
      encounterSetId,
      encounterSetLabel,
      runsPerEncounter,
    },
    requested: {
      classId: context.classId,
      mercenaryId: context.mercenaryId,
      actNumber: context.scenario.actNumber,
      targetLevel: context.scenario.targetLevel,
      maxTurns: context.scenario.maxTurns,
      deckSize: context.deck.length,
      favoredTreeId: String(spec.favoredTreeId || ""),
      treeRanks: { ...(spec.treeRanks || {}) },
      equippedSkillIds: { ...(spec.equippedSkillIds || {}) },
      bypassTrainingGates: spec.bypassTrainingGates !== false,
    },
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
      beamDecisionRate: roundTo(encounters.reduce((sum, encounter) => sum + encounter.beamDecisionRate * runsPerEncounter, 0) / totalAttempts),
      averageBeamDepth: roundTo(encounters.reduce((sum, encounter) => sum + encounter.averageBeamDepth * runsPerEncounter, 0) / totalAttempts),
      beamOverrideRate: roundTo(encounters.reduce((sum, encounter) => sum + encounter.beamOverrideRate * runsPerEncounter, 0) / totalAttempts),
    },
  };
}
