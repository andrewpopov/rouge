import { createAppHarness } from "./browser-harness";
import {
  getMatchingProficienciesForWeapon,
  scoreEncounterPowerFromDefinition,
  scorePartyPower,
} from "./balance-power-score";

const DEFAULT_CLASS_IDS = ["amazon", "assassin", "barbarian", "druid", "necromancer", "paladin", "sorceress"] as const;
const DEFAULT_POLICY_IDS = ["balanced", "aggressive", "control", "bulwark"] as const;

const DEFAULT_MERCENARY_BY_CLASS: Record<string, string> = {
  amazon: "rogue_scout",
  assassin: "rogue_scout",
  barbarian: "desert_guard",
  druid: "desert_guard",
  necromancer: "iron_wolf",
  paladin: "desert_guard",
  sorceress: "iron_wolf",
};

const POLICY_ARCHETYPE_PRIORITIES: Record<string, Record<string, string[]>> = {
  aggressive: {
    amazon: ["amazon_bow_and_crossbow", "amazon_javelin_and_spear"],
    assassin: ["assassin_martial_arts", "assassin_traps"],
    barbarian: ["barbarian_combat_skills", "barbarian_warcries"],
    druid: ["druid_elemental", "druid_shape_shifting"],
    necromancer: ["necromancer_poison_and_bone", "necromancer_curses"],
    paladin: ["paladin_combat_skills", "paladin_offensive_auras"],
    sorceress: ["sorceress_lightning", "sorceress_fire"],
  },
};

const CARD_EFFECT_BASE_WEIGHTS: Record<CardEffectKind, number> = {
  damage: 2.2,
  damage_all: 2.8,
  gain_guard_self: 1.3,
  gain_guard_party: 1.6,
  heal_hero: 1.6,
  heal_mercenary: 0.8,
  draw: 3.0,
  mark_enemy_for_mercenary: 3.0,
  buff_mercenary_next_attack: 2.0,
  apply_burn: 2.0,
  apply_burn_all: 2.5,
  apply_poison: 2.0,
  apply_poison_all: 2.5,
  apply_slow: 2.2,
  apply_slow_all: 2.8,
  apply_freeze: 2.6,
  apply_freeze_all: 3.0,
  apply_stun: 2.8,
  apply_stun_all: 3.2,
  apply_paralyze: 2.8,
  apply_paralyze_all: 3.2,
};

const STATUS_WEIGHTS = {
  burn: 1.5,
  poison: 1.5,
  slow: 2.5,
  freeze: 3.5,
  stun: 4.0,
  paralyze: 4.0,
};

const HERO_DEBUFF_WEIGHTS = {
  heroBurn: 1.5,
  heroPoison: 1.5,
  chill: 1.5,
  amplify: 2.0,
  weaken: 2.0,
  energyDrain: 1.5,
};

const ATTACK_INTENT_KINDS = new Set<EnemyIntentKind>([
  "attack",
  "attack_all",
  "attack_and_guard",
  "drain_attack",
  "sunder_attack",
  "attack_burn",
  "attack_burn_all",
  "attack_lightning",
  "attack_lightning_all",
  "attack_poison",
  "attack_poison_all",
  "attack_chill",
  "drain_energy",
]);

interface BuildPolicyDefinition {
  id: string;
  label: string;
  description: string;
  heroLifeWeight: number;
  heroEnergyWeight: number;
  heroDamageWeight: number;
  heroGuardWeight: number;
  heroBurnWeight: number;
  heroPotionWeight: number;
  mercenaryLifeWeight: number;
  mercenaryAttackWeight: number;
  goldWeight: number;
  potionChargeWeight: number;
  currentLifeWeight: number;
  currentMercLifeWeight: number;
  deckTopWeight: number;
  deckRestWeight: number;
  deckBloatPenalty: number;
  weaponWeight: number;
  armorWeight: number;
  matchingProficiencyWeight: number;
  bankedSkillPointWeight: number;
  bankedClassPointWeight: number;
  bankedAttributePointWeight: number;
  cardEffectMultipliers: Partial<Record<CardEffectKind, number>>;
}

const BUILD_POLICIES: Record<string, BuildPolicyDefinition> = {
  balanced: {
    id: "balanced",
    label: "Balanced",
    description: "Mixed offense, survival, and build quality with no extreme bias.",
    heroLifeWeight: 1.05,
    heroEnergyWeight: 0.75,
    heroDamageWeight: 2.7,
    heroGuardWeight: 1.85,
    heroBurnWeight: 1.1,
    heroPotionWeight: 0.9,
    mercenaryLifeWeight: 0.8,
    mercenaryAttackWeight: 1.45,
    goldWeight: 0.05,
    potionChargeWeight: 2.1,
    currentLifeWeight: 0.8,
    currentMercLifeWeight: 0.45,
    deckTopWeight: 1.0,
    deckRestWeight: 0.4,
    deckBloatPenalty: 1.6,
    weaponWeight: 1.0,
    armorWeight: 1.0,
    matchingProficiencyWeight: 2.1,
    bankedSkillPointWeight: 2.0,
    bankedClassPointWeight: 4.0,
    bankedAttributePointWeight: 3.5,
    cardEffectMultipliers: {
      draw: 1.1,
      mark_enemy_for_mercenary: 1.05,
      buff_mercenary_next_attack: 1.05,
    },
  },
  aggressive: {
    id: "aggressive",
    label: "Aggressive",
    description: "Prioritizes fast kills, high-pressure weapon lines, and burst card quality.",
    heroLifeWeight: 0.85,
    heroEnergyWeight: 0.55,
    heroDamageWeight: 3.35,
    heroGuardWeight: 1.2,
    heroBurnWeight: 1.2,
    heroPotionWeight: 0.7,
    mercenaryLifeWeight: 0.55,
    mercenaryAttackWeight: 1.8,
    goldWeight: 0.015,
    potionChargeWeight: 1.4,
    currentLifeWeight: 0.55,
    currentMercLifeWeight: 0.25,
    deckTopWeight: 1.15,
    deckRestWeight: 0.3,
    deckBloatPenalty: 2.1,
    weaponWeight: 1.25,
    armorWeight: 0.8,
    matchingProficiencyWeight: 2.8,
    bankedSkillPointWeight: 1.6,
    bankedClassPointWeight: 3.5,
    bankedAttributePointWeight: 3.0,
    cardEffectMultipliers: {
      damage: 1.3,
      damage_all: 1.25,
      apply_burn: 1.1,
      apply_burn_all: 1.1,
      mark_enemy_for_mercenary: 1.2,
      buff_mercenary_next_attack: 1.15,
      gain_guard_self: 0.8,
      gain_guard_party: 0.8,
      heal_hero: 0.75,
      heal_mercenary: 0.7,
      draw: 0.95,
      apply_freeze: 0.85,
      apply_freeze_all: 0.85,
      apply_stun: 0.9,
      apply_stun_all: 0.9,
      apply_slow: 0.85,
      apply_slow_all: 0.85,
      apply_paralyze: 0.85,
      apply_paralyze_all: 0.85,
    },
  },
  control: {
    id: "control",
    label: "Control",
    description: "Leans on energy, draw, typed damage, and disabling effects to win slower fights.",
    heroLifeWeight: 0.9,
    heroEnergyWeight: 1.25,
    heroDamageWeight: 2.35,
    heroGuardWeight: 1.05,
    heroBurnWeight: 1.8,
    heroPotionWeight: 0.8,
    mercenaryLifeWeight: 0.6,
    mercenaryAttackWeight: 1.25,
    goldWeight: 0.04,
    potionChargeWeight: 1.6,
    currentLifeWeight: 0.6,
    currentMercLifeWeight: 0.3,
    deckTopWeight: 1.05,
    deckRestWeight: 0.45,
    deckBloatPenalty: 1.7,
    weaponWeight: 1.05,
    armorWeight: 0.9,
    matchingProficiencyWeight: 2.0,
    bankedSkillPointWeight: 2.2,
    bankedClassPointWeight: 4.2,
    bankedAttributePointWeight: 3.8,
    cardEffectMultipliers: {
      draw: 1.25,
      apply_burn: 1.3,
      apply_burn_all: 1.35,
      apply_poison: 1.25,
      apply_poison_all: 1.3,
      apply_slow: 1.35,
      apply_slow_all: 1.35,
      apply_freeze: 1.4,
      apply_freeze_all: 1.4,
      apply_stun: 1.3,
      apply_stun_all: 1.3,
      apply_paralyze: 1.35,
      apply_paralyze_all: 1.35,
      gain_guard_self: 0.85,
      gain_guard_party: 0.9,
      heal_hero: 0.8,
      heal_mercenary: 0.75,
      damage: 0.95,
    },
  },
  bulwark: {
    id: "bulwark",
    label: "Bulwark",
    description: "Favours guard, life, mercenary durability, and attrition-resistant setups.",
    heroLifeWeight: 1.55,
    heroEnergyWeight: 0.65,
    heroDamageWeight: 2.05,
    heroGuardWeight: 2.25,
    heroBurnWeight: 0.8,
    heroPotionWeight: 1.35,
    mercenaryLifeWeight: 1.25,
    mercenaryAttackWeight: 1.25,
    goldWeight: 0.06,
    potionChargeWeight: 2.6,
    currentLifeWeight: 1.0,
    currentMercLifeWeight: 0.7,
    deckTopWeight: 0.95,
    deckRestWeight: 0.45,
    deckBloatPenalty: 1.45,
    weaponWeight: 0.95,
    armorWeight: 1.25,
    matchingProficiencyWeight: 1.8,
    bankedSkillPointWeight: 2.1,
    bankedClassPointWeight: 4.0,
    bankedAttributePointWeight: 3.7,
    cardEffectMultipliers: {
      gain_guard_self: 1.35,
      gain_guard_party: 1.4,
      heal_hero: 1.3,
      heal_mercenary: 1.25,
      mark_enemy_for_mercenary: 1.15,
      buff_mercenary_next_attack: 1.15,
      damage: 0.95,
      damage_all: 0.95,
      draw: 0.95,
    },
  },
};

interface CombatCandidateAction {
  type: "card" | "melee" | "potion" | "end_turn";
  score: number;
  instanceId?: string;
  targetId?: string;
  potionTarget?: "hero" | "mercenary";
}

interface PolicyProgressSummary {
  actionCounts: Record<string, number>;
  rewardKindCounts: Record<string, number>;
  rewardEffectCounts: Record<string, number>;
  rewardRoleCounts: Record<string, number>;
  strategyRoleCounts: Record<string, number>;
  zoneKindCounts: Record<string, number>;
  zoneRoleCounts: Record<string, number>;
  nodeTypeCounts: Record<string, number>;
  encounterResults: EncounterRunMetric[];
}

export interface EncounterRunMetric {
  actNumber: number;
  encounterId: string;
  encounterName: string;
  zoneTitle: string;
  kind: "boss" | "elite" | "battle";
  zoneKind: string;
  zoneRole: string;
  outcome: string;
  turns: number;
  heroLifePct: number;
  mercenaryLifePct: number;
  enemyLifePct: number;
  heroPowerScore: number;
  enemyPowerScore: number;
  powerRatio: number;
}

interface ProbeEncounterSummary {
  encounterId: string;
  encounterName: string;
  zoneTitle: string;
  kind: "boss" | "elite" | "battle";
  enemyPowerScore: number;
  powerDelta: number;
  powerRatio: number;
  runs: number;
  winRate: number;
  averageTurns: number;
  averageHeroLifePct: number;
  averageMercenaryLifePct: number;
  averageEnemyLifePct: number;
}

export interface SafeZoneCheckpointSummary {
  checkpointId: string;
  label: string;
  actNumber: number;
  level: number;
  gold: number;
  powerScore: number;
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
  deckSize: number;
  topCards: string[];
  deckProficiencies: Array<{ proficiency: string; count: number }>;
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
    name: string;
    maxLife: number;
    attack: number;
  };
  attributes: Record<string, number>;
  training: Record<string, number>;
  favoredTreeId: string;
  favoredTreeName: string;
  dominantArchetypeId: string;
  dominantArchetypeLabel: string;
  dominantArchetypeScore: number;
  secondaryArchetypeId: string;
  secondaryArchetypeLabel: string;
  secondaryArchetypeScore: number;
  archetypeScores: Array<{ archetypeId: string; label: string; score: number }>;
  weapon: {
    itemId: string;
    name: string;
    family: string;
    rarity: string;
  } | null;
  activeRunewords: string[];
  runewordsForged: number;
  armor: {
    resistances: Array<{ type: DamageType; amount: number }>;
    immunities: DamageType[];
  };
  choiceCounts: Record<string, number>;
  probes: ProbeEncounterSummary[];
}

export interface SimulationFailureSummary {
  actNumber: number;
  zoneTitle: string;
  encounterId: string;
  encounterName: string;
  kind?: "boss" | "elite" | "battle";
  zoneKind?: string;
  zoneRole?: string;
  nodeType?: string;
}

interface FinalBuildSummary {
  level: number;
  deckSize: number;
  topCards: string[];
  deckProficiencies: Array<{ proficiency: string; count: number }>;
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
    name: string;
    maxLife: number;
    attack: number;
  };
  weapon: {
    itemId: string;
    name: string;
    family: string;
    rarity: string;
    preferredForClass: boolean;
    damageTypes: Array<{ type: WeaponDamageType; amount: number }>;
    effects: Array<{ kind: WeaponEffectKind; amount: number }>;
  } | null;
  armor: {
    itemId: string;
    name: string;
    rarity: string;
    resistances: Array<{ type: DamageType; amount: number }>;
    immunities: DamageType[];
  } | null;
  favoredTreeId: string;
  favoredTreeName: string;
  dominantArchetypeId: string;
  dominantArchetypeLabel: string;
  dominantArchetypeScore: number;
  secondaryArchetypeId: string;
  secondaryArchetypeLabel: string;
  secondaryArchetypeScore: number;
  archetypeScores: Array<{ archetypeId: string; label: string; score: number }>;
  activeRunewords: string[];
}

interface WorldProgressSummary {
  resolvedNodeCount: number;
  worldFlagCount: number;
  questOutcomes: number;
  questFollowUpsResolved: number;
  questChainsResolved: number;
  shrineOutcomes: number;
  eventOutcomes: number;
  opportunityOutcomes: number;
}

export interface PolicyRunSummary {
  runSummary: RunState["summary"];
  zoneKindCounts: Record<string, number>;
  zoneRoleCounts: Record<string, number>;
  nodeTypeCounts: Record<string, number>;
  rewardKindCounts: Record<string, number>;
  choiceKindCounts: Record<string, number>;
  rewardEffectCounts: Record<string, number>;
  rewardRoleCounts: Record<string, number>;
  strategyRoleCounts: Record<string, number>;
  encounterResults: EncounterRunMetric[];
  encounterMetricsByKind: Record<string, {
    count: number;
    winRate: number;
    averageTurns: number;
    averageHeroLifePct: number;
    averageMercenaryLifePct: number;
    averageEnemyLifePct: number;
    averagePowerRatio: number;
  }>;
  world: WorldProgressSummary;
  finalBuild: FinalBuildSummary;
}

interface PolicySimulationReport {
  policyId: string;
  policyLabel: string;
  description: string;
  assumptions: string[];
  outcome: "reached_checkpoint" | "run_complete" | "run_failed";
  finalActNumber: number;
  finalLevel: number;
  checkpoints: SafeZoneCheckpointSummary[];
  failure: SimulationFailureSummary | null;
  summary: PolicyRunSummary;
}

interface ClassProgressionReport {
  classId: string;
  className: string;
  policyReports: PolicySimulationReport[];
}

export interface RunProgressionSimulationReport {
  generatedAt: string;
  throughActNumber: number;
  classReports: ClassProgressionReport[];
}

export interface RunProgressionSimulationOptions {
  classIds?: string[];
  policyIds?: string[];
  throughActNumber?: number;
  probeRuns?: number;
  maxCombatTurns?: number;
  seedOffset?: number;
}

export interface TrackedRandomFn extends RandomFn {
  getState(): number;
  getSeed(): number;
  setState(state: number): void;
}

export interface RunProgressionContinuationContext {
  policyId: string;
  throughActNumber: number;
  probeRuns: number;
  maxCombatTurns: number;
  seedOffset: number;
  progress: PolicyProgressSummary;
  checkpoints: SafeZoneCheckpointSummary[];
  failure: SimulationFailureSummary | null;
  lastEncounterContext: SimulationFailureSummary | null;
}

interface PolicySimulationHooks {
  onInitialized?: (payload: {
    state: AppState;
    harness: ReturnType<typeof createAppHarness>;
    policy: BuildPolicyDefinition;
    classId: string;
    seedOffset: number;
    continuationContext: RunProgressionContinuationContext;
  }) => void;
  onCheckpoint?: (payload: {
    state: AppState;
    harness: ReturnType<typeof createAppHarness>;
    policy: BuildPolicyDefinition;
    classId: string;
    seedOffset: number;
    checkpoint: SafeZoneCheckpointSummary;
    continuationContext: RunProgressionContinuationContext;
  }) => void;
  onEncounterStart?: (payload: {
    state: AppState;
    harness: ReturnType<typeof createAppHarness>;
    policy: BuildPolicyDefinition;
    classId: string;
    seedOffset: number;
    encounter: SimulationFailureSummary;
    continuationContext: RunProgressionContinuationContext;
  }) => void;
  onRunFailure?: (payload: {
    state: AppState;
    harness: ReturnType<typeof createAppHarness>;
    policy: BuildPolicyDefinition;
    classId: string;
    seedOffset: number;
    failure: SimulationFailureSummary | null;
    report: PolicySimulationReport;
    continuationContext: RunProgressionContinuationContext;
  }) => void;
  onRunComplete?: (payload: {
    state: AppState;
    harness: ReturnType<typeof createAppHarness>;
    policy: BuildPolicyDefinition;
    classId: string;
    seedOffset: number;
    report: PolicySimulationReport;
    continuationContext: RunProgressionContinuationContext;
  }) => void;
}

function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, value));
}

function roundTo(value: number, digits = 2) {
  const factor = 10 ** digits;
  return Math.round(value * factor) / factor;
}

function incrementCount(target: Record<string, number>, key: string | null | undefined, amount = 1) {
  const normalizedKey = String(key || "").trim();
  if (!normalizedKey) {
    return;
  }
  target[normalizedKey] = (target[normalizedKey] || 0) + amount;
}

function hashString(value: string) {
  let hash = 2166136261;
  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

export function createProgressionSimulationSeed(classId: string, policyId: string, throughActNumber: number, seedOffset: number) {
  return hashString([classId, policyId, String(throughActNumber), String(seedOffset)].join("|"));
}

export function createTrackedRandom(seed: number, initialState?: number): TrackedRandomFn {
  let state = (initialState ?? seed) >>> 0;
  if (!state) {
    state = 1;
  }
  const randomFn = (() => {
    state = (Math.imul(state, 1664525) + 1013904223) >>> 0;
    return state / 0x100000000;
  }) as TrackedRandomFn;
  randomFn.getState = () => state >>> 0;
  randomFn.getSeed = () => (seed >>> 0) || 1;
  randomFn.setState = (nextState: number) => {
    state = (nextState >>> 0) || 1;
  };
  return randomFn;
}

function createSeededRandom(seed: number): RandomFn {
  return createTrackedRandom(seed);
}

export function getTrackedRandomState(randomFn: RandomFn | null | undefined) {
  const tracked = randomFn as Partial<TrackedRandomFn> | null | undefined;
  if (!tracked || typeof tracked.getState !== "function" || typeof tracked.getSeed !== "function") {
    return null;
  }
  return {
    seed: Number(tracked.getSeed()),
    state: Number(tracked.getState()),
  };
}

export function createQuietAppHarness() {
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

function getPolicyDefinitions(policyIds: string[] | undefined) {
  const resolvedIds = policyIds && policyIds.length > 0 ? policyIds : [...DEFAULT_POLICY_IDS];
  return resolvedIds.map((policyId) => {
    const policy = BUILD_POLICIES[policyId];
    if (!policy) {
      throw new Error(`Unknown progression policy: ${policyId}`);
    }
    return policy;
  });
}

function getMercenaryIdForClass(classId: string) {
  return DEFAULT_MERCENARY_BY_CLASS[classId] || "rogue_scout";
}

function getWeaponEquipment(run: RunState) {
  return run.loadout?.weapon || null;
}

function getArmorEquipment(run: RunState) {
  return run.loadout?.armor || null;
}

function getWeaponFamily(harness: ReturnType<typeof createAppHarness>, run: RunState) {
  const weaponEquipment = getWeaponEquipment(run);
  return harness.browserWindow.ROUGE_ITEM_CATALOG.getWeaponFamily(weaponEquipment?.itemId || "", harness.content) || "";
}

function getWeaponProfile(harness: ReturnType<typeof createAppHarness>, run: RunState) {
  return harness.browserWindow.ROUGE_ITEM_CATALOG.buildEquipmentWeaponProfile(getWeaponEquipment(run), harness.content) || null;
}

function getLoadoutItemTier(harness: ReturnType<typeof createAppHarness>, equipment: RunEquipmentState | null | undefined) {
  if (!equipment?.itemId) {
    return 0;
  }
  return Number(harness.content.itemCatalog?.[equipment.itemId]?.progressionTier || 0);
}

function getLoadoutTierScore(harness: ReturnType<typeof createAppHarness>, run: RunState) {
  const weaponTier = getLoadoutItemTier(harness, run.loadout?.weapon || null);
  const armorTier = getLoadoutItemTier(harness, run.loadout?.armor || null);
  const helmTier = getLoadoutItemTier(harness, run.loadout?.helm || null);
  const shieldTier = getLoadoutItemTier(harness, run.loadout?.shield || null);
  const preferredWeaponFamilies = harness.classRegistry.getPreferredWeaponFamilies(run.classId) || [];
  const weaponFamily = getWeaponFamily(harness, run);
  const preferredWeaponTierWeight =
    preferredWeaponFamilies.length === 0 || preferredWeaponFamilies.includes(weaponFamily)
      ? 26
      : 10;
  return weaponTier * preferredWeaponTierWeight + armorTier * 14 + helmTier * 6 + shieldTier * 6;
}

function getEquipmentRarityScore(rarity: string | undefined) {
  switch (String(rarity || "").toLowerCase()) {
    case "brown":
      return 4;
    case "yellow":
      return 3;
    case "blue":
      return 2;
    default:
      return 1;
  }
}

function getCarriedEntryScore(harness: ReturnType<typeof createAppHarness>, entry: InventoryEntry) {
  if (entry.kind === "equipment") {
    const item = harness.browserWindow.ROUGE_ITEM_CATALOG.getItemDefinition(harness.content, entry.equipment.itemId);
    const tier = Number(item?.progressionTier || 0);
    return tier * 10 + getEquipmentRarityScore(entry.equipment.rarity);
  }
  const rune = harness.browserWindow.ROUGE_ITEM_CATALOG.getRuneDefinition(harness.content, entry.runeId);
  const tier = Number(rune?.progressionTier || 0);
  return 100 + tier * 10;
}

function discardLowestValueCarriedEntry(harness: ReturnType<typeof createAppHarness>, run: RunState) {
  const carried = Array.isArray(run.inventory?.carried) ? run.inventory.carried : [];
  if (carried.length === 0) {
    return false;
  }
  let lowestIndex = 0;
  let lowestScore = getCarriedEntryScore(harness, carried[0]);
  for (let index = 1; index < carried.length; index += 1) {
    const score = getCarriedEntryScore(harness, carried[index]);
    if (score < lowestScore) {
      lowestScore = score;
      lowestIndex = index;
    }
  }
  carried.splice(lowestIndex, 1);
  return true;
}

function getMatchingWeaponProficienciesForRun(
  harness: ReturnType<typeof createAppHarness>,
  run: RunState,
  weaponProfile?: WeaponCombatProfile | null
) {
  return getMatchingProficienciesForWeapon(
    getWeaponFamily(harness, run),
    weaponProfile ?? getWeaponProfile(harness, run)
  );
}

function getMatchingWeaponProficienciesForCombatState(state: CombatState) {
  return getMatchingProficienciesForWeapon(state.weaponFamily || "", state.weaponProfile || undefined);
}

function hasPreferredWeaponFamily(harness: ReturnType<typeof createAppHarness>, run: RunState) {
  const preferred = harness.classRegistry.getPreferredWeaponFamilies(run.classId) || [];
  return preferred.includes(getWeaponFamily(harness, run));
}

function getWeaponProficiencyWeight(proficiencyCounts: Record<string, number>, proficiency?: string) {
  if (!proficiency) {
    return 1;
  }
  const cardCount = Number(proficiencyCounts[proficiency] || 0);
  if (cardCount <= 0) {
    return 0.1;
  }
  return 1 + Math.min(0.45, cardCount * 0.08);
}

function scoreWeaponProfileForDeck(profile: WeaponCombatProfile | undefined, proficiencyCounts: Record<string, number>) {
  if (!profile) {
    return 0;
  }
  const attackScore = Object.entries(profile.attackDamageByProficiency || {}).reduce((sum, [proficiency, value]) => {
    return sum + Number(value || 0) * 2.6 * getWeaponProficiencyWeight(proficiencyCounts, proficiency);
  }, 0);
  const supportScore = Object.entries(profile.supportValueByProficiency || {}).reduce((sum, [proficiency, value]) => {
    return sum + Number(value || 0) * 1.3 * getWeaponProficiencyWeight(proficiencyCounts, proficiency);
  }, 0);
  const typedDamageScore = (profile.typedDamage || []).reduce((sum, entry) => {
    return sum + Number(entry.amount || 0) * 2.4 * getWeaponProficiencyWeight(proficiencyCounts, entry.proficiency);
  }, 0);
  const effectScore = (profile.effects || []).reduce((sum, entry) => {
    return sum + Number(entry.amount || 0) * 1.7 * getWeaponProficiencyWeight(proficiencyCounts, entry.proficiency);
  }, 0);
  return attackScore + supportScore + typedDamageScore + effectScore;
}

function scoreArmorProfile(profile: ArmorMitigationProfile | undefined) {
  if (!profile) {
    return 0;
  }
  const resistanceScore = (profile.resistances || []).reduce((sum, entry) => sum + Number(entry.amount || 0), 0) * 1.85;
  const immunityScore = (profile.immunities || []).length * 12;
  return resistanceScore + immunityScore;
}

function scoreRunewordProgress(
  harness: ReturnType<typeof createAppHarness>,
  run: RunState
) {
  const itemCatalog = harness.browserWindow.ROUGE_ITEM_CATALOG;
  const loadout = itemCatalog.buildHydratedLoadout(run, harness.content);

  function getRunewordPower(runeword: RuntimeRunewordDefinition | null) {
    if (!runeword) {
      return 0;
    }
    return Object.values(runeword.bonuses || {}).reduce((sum, value) => {
      return sum + Math.max(0, Number(value || 0));
    }, 0);
  }

  return (["weapon", "armor"] as const).reduce((total, slot) => {
    const equipment = loadout[slot];
    if (!equipment) {
      return total;
    }

    const targetRuneword = itemCatalog.getPreferredRunewordForEquipment(equipment, run, harness.content);
    if (!targetRuneword) {
      return total;
    }

    const currentRuneword = itemCatalog.getRunewordDefinition(harness.content, equipment.runewordId || "");
    const currentPower = getRunewordPower(currentRuneword);
    const targetPower = getRunewordPower(targetRuneword);
    const targetSocketCount = Math.max(1, Number(targetRuneword.socketCount || 0));
    const insertedRunes = Array.isArray(equipment.insertedRunes) ? equipment.insertedRunes : [];
    const prefixLength = insertedRunes.reduce((count: number, runeId: string, index: number) => {
      return count === index && targetRuneword.requiredRunes[index] === runeId ? count + 1 : count;
    }, 0);
    const socketProgress = Math.min(targetSocketCount, Number(equipment.socketsUnlocked || 0)) / targetSocketCount;
    const runeProgress = prefixLength / Math.max(1, targetRuneword.requiredRunes.length);
    const upgradeGap = Math.max(0, targetPower - currentPower);
    const isTargetComplete =
      equipment.runewordId === targetRuneword.id &&
      Number(equipment.socketsUnlocked || 0) >= targetSocketCount &&
      insertedRunes.length >= targetRuneword.requiredRunes.length;

    if (isTargetComplete) {
      return total + targetPower * 5.5;
    }

    return total + targetPower * (1.2 + socketProgress + runeProgress) + upgradeGap * 3.5;
  }, 0);
}

function scoreArchetypePlan(
  harness: ReturnType<typeof createAppHarness>,
  run: RunState,
  policy: BuildPolicyDefinition
) {
  const rewardEngine = harness.browserWindow.ROUGE_REWARD_ENGINE;
  const entries = rewardEngine?.getArchetypeScoreEntries?.(run, harness.content) || [];
  if (!Array.isArray(entries) || entries.length === 0) {
    return 0;
  }

  const primary = entries[0] || null;
  const secondary = entries[1] || null;
  const preferred = POLICY_ARCHETYPE_PRIORITIES[policy.id]?.[run.classId] || [];
  const preferredEntries = entries.filter((entry) => preferred.includes(entry.archetypeId));
  const bestPreferredScore = Number(preferredEntries[0]?.score || 0);
  const commitmentScore = Math.max(0, Number(primary?.score || 0) - Number(secondary?.score || 0));

  let total = Number(primary?.score || 0) * 0.2 + commitmentScore * 0.35;

  if (preferred.length > 0) {
    total += bestPreferredScore * 0.9;
    if (primary && preferred.includes(primary.archetypeId)) {
      total += preferred[0] === primary.archetypeId ? 42 : 24;
    } else if (primary) {
      total -= 28;
    }
    if (secondary && preferred.includes(secondary.archetypeId)) {
      total += 10;
    }
  }

  return total;
}

function scoreCard(card: CardDefinition | null | undefined, policy: BuildPolicyDefinition, matchingProficiencies: Set<string>) {
  if (!card) {
    return Number.NEGATIVE_INFINITY;
  }
  const effectScore = (card.effects || []).reduce((sum, effect) => {
    const multiplier = policy.cardEffectMultipliers[effect.kind] || 1;
    return sum + CARD_EFFECT_BASE_WEIGHTS[effect.kind] * Number(effect.value || 0) * multiplier;
  }, 0);
  const tierBonus = Number(card.tier || 1) * 2.5;
  const neutralTargetBonus = card.target === "none" ? 1 : 0;
  const proficiencyBonus = card.proficiency && matchingProficiencies.has(card.proficiency) ? policy.matchingProficiencyWeight : 0;
  return effectScore + tierBonus + neutralTargetBonus + proficiencyBonus - card.cost * 2.4;
}

function buildDeckStats(harness: ReturnType<typeof createAppHarness>, run: RunState, policy: BuildPolicyDefinition) {
  const matchingProficiencies = new Set(getMatchingWeaponProficienciesForRun(harness, run));
  const preferredFamilyMatch = hasPreferredWeaponFamily(harness, run);
  const scores = run.deck
    .map((cardId) => scoreCard(harness.content.cardCatalog[cardId], policy, matchingProficiencies))
    .filter((score) => Number.isFinite(score))
    .sort((left, right) => right - left);
  const topCards = scores.slice(0, 10);
  const restCards = scores.slice(10);
  const deckScore =
    topCards.reduce((sum, score) => sum + score, 0) * policy.deckTopWeight +
    restCards.reduce((sum, score) => sum + score, 0) * policy.deckRestWeight -
    Math.max(0, run.deck.length - 16) * policy.deckBloatPenalty;

  const proficiencyCounts = run.deck.reduce((counts, cardId) => {
    const proficiency = harness.content.cardCatalog[cardId]?.proficiency || "neutral";
    counts[proficiency] = (counts[proficiency] || 0) + 1;
    return counts;
  }, {} as Record<string, number>);

  const matchingProficiencyCount = [...matchingProficiencies].reduce((sum, proficiency) => {
    return sum + Number(proficiencyCounts[proficiency] || 0);
  }, 0);
  return {
    deckScore,
    matchingProficiencyCount,
    preferredFamilyMatch,
    topCards: run.deck
      .slice()
      .sort((leftId, rightId) => {
        return scoreCard(harness.content.cardCatalog[rightId], policy, matchingProficiencies) -
          scoreCard(harness.content.cardCatalog[leftId], policy, matchingProficiencies);
      })
      .slice(0, 5)
      .map((cardId) => harness.content.cardCatalog[cardId]?.title || cardId),
    proficiencyCounts,
  };
}

function createScoringRun(harness: ReturnType<typeof createAppHarness>, run: RunState, assumeFullResources: boolean) {
  const deepClone = harness.browserWindow.ROUGE_UTILS.deepClone as <T>(value: T) => T;
  const clone = harness.runFactory.hydrateRun(deepClone(run), harness.content);
  if (assumeFullResources) {
    const bonuses = harness.runFactory.buildCombatBonuses(clone, harness.content, null);
    clone.hero.currentLife = clone.hero.maxLife + Number(bonuses.heroMaxLife || 0);
    clone.mercenary.currentLife = clone.mercenary.maxLife + Number(bonuses.mercenaryMaxLife || 0);
    clone.belt.current = clone.belt.max;
  }
  return clone;
}

function evaluateRunScore(
  harness: ReturnType<typeof createAppHarness>,
  run: RunState,
  policy: BuildPolicyDefinition,
  options: { assumeFullResources: boolean }
) {
  const scoringRun = createScoringRun(harness, run, options.assumeFullResources);
  const overrides = harness.runFactory.createCombatOverrides(scoringRun, harness.content, null);
  const weaponProfile = getWeaponProfile(harness, scoringRun);
  const armorProfile = harness.itemSystem.buildCombatMitigationProfile(scoringRun, harness.content) || null;
  const deckStats = buildDeckStats(harness, scoringRun, policy);

  return (
    scoringRun.level * 6 +
    overrides.heroState.maxLife * policy.heroLifeWeight +
    overrides.heroState.maxEnergy * policy.heroEnergyWeight +
    Math.max(0, Number(overrides.heroState.handSize || 5) - 5) * 8 +
    Number(overrides.heroState.damageBonus || 0) * policy.heroDamageWeight +
    Number(overrides.heroState.guardBonus || 0) * policy.heroGuardWeight +
    Number(overrides.heroState.burnBonus || 0) * policy.heroBurnWeight +
    overrides.heroState.potionHeal * policy.heroPotionWeight +
    overrides.mercenaryState.maxLife * policy.mercenaryLifeWeight +
    overrides.mercenaryState.attack * policy.mercenaryAttackWeight +
    scoringRun.gold * policy.goldWeight +
    scoringRun.belt.current * policy.potionChargeWeight +
    scoringRun.hero.currentLife * policy.currentLifeWeight +
    Math.max(0, scoringRun.mercenary.currentLife) * policy.currentMercLifeWeight +
    deckStats.deckScore +
    deckStats.matchingProficiencyCount * policy.matchingProficiencyWeight +
    (deckStats.preferredFamilyMatch ? 24 : 0) +
    getLoadoutTierScore(harness, scoringRun) +
    scoreWeaponProfileForDeck(weaponProfile || undefined, deckStats.proficiencyCounts) * policy.weaponWeight +
    scoreArmorProfile(armorProfile || undefined) * policy.armorWeight +
    scoreRunewordProgress(harness, scoringRun) +
    scoreArchetypePlan(harness, scoringRun, policy) +
    Number(scoringRun.progression?.skillPointsAvailable || 0) * policy.bankedSkillPointWeight +
    Number(scoringRun.progression?.classPointsAvailable || 0) * policy.bankedClassPointWeight +
    Number(scoringRun.progression?.attributePointsAvailable || 0) * policy.bankedAttributePointWeight
  );
}

function cloneRun(harness: ReturnType<typeof createAppHarness>, run: RunState) {
  const deepClone = harness.browserWindow.ROUGE_UTILS.deepClone as <T>(value: T) => T;
  return harness.runFactory.hydrateRun(deepClone(run), harness.content);
}

function isOptimizableTownAction(action: TownAction) {
  const actionId = action.id || "";
  if (action.disabled) {
    return false;
  }
  if (actionId.startsWith("progression_")) {
    return true;
  }
  if (
    actionId === "healer_restore_party" ||
    actionId === "quartermaster_refill_belt"
  ) {
    return true;
  }
  if (
    actionId.startsWith("mercenary_contract_") ||
    actionId.startsWith("vendor_buy_") ||
    actionId.startsWith("inventory_equip_") ||
    actionId.startsWith("inventory_socket_") ||
    actionId.startsWith("inventory_commission_") ||
    actionId.startsWith("blacksmith_evolve_") ||
    actionId.startsWith("sage_purge_")
  ) {
    return true;
  }
  return false;
}

function optimizeSafeZoneRun(
  harness: ReturnType<typeof createAppHarness>,
  run: RunState,
  profile: ProfileState,
  policy: BuildPolicyDefinition,
  maxIterations = 24
) {
  const townServices = harness.browserWindow.ROUGE_TOWN_SERVICES;
  const isGearFollowupAction = (actionId: string, allowVendorBuys = true) => {
    return (
      (allowVendorBuys && actionId.startsWith("vendor_buy_")) ||
      actionId.startsWith("inventory_equip_") ||
      actionId.startsWith("inventory_commission_") ||
      actionId.startsWith("inventory_socket_")
    );
  };

  function findBestImmediateGearFollowup(targetRun: RunState, allowVendorBuys: boolean) {
    const baseScore = evaluateRunScore(harness, targetRun, policy, { assumeFullResources: false });
    const actions = townServices
      .listActions(harness.content, targetRun, profile)
      .filter((action: TownAction) => {
        const actionId = action.id || "";
        return !action.disabled && isGearFollowupAction(actionId, allowVendorBuys);
      });

    let bestAction: TownAction | null = null;
    let bestDelta = 0;

    actions.forEach((action: TownAction) => {
      const clone = cloneRun(harness, targetRun);
      const result = townServices.applyAction(clone, profile, harness.content, action.id);
      if (!result.ok) {
        return;
      }

      const nextScore = evaluateRunScore(harness, clone, policy, { assumeFullResources: false });
      const delta = nextScore - baseScore;
      if (delta > bestDelta) {
        bestDelta = delta;
        bestAction = action;
      }
    });

    return { bestAction, bestDelta };
  }

  function settleGearFollowups(targetRun: RunState, maxFollowups = 4, allowVendorBuys = false) {
    for (let followupIndex = 0; followupIndex < maxFollowups; followupIndex += 1) {
      const { bestAction, bestDelta } = findBestImmediateGearFollowup(targetRun, allowVendorBuys && followupIndex === 0);
      if (!bestAction || bestDelta <= 0.05) {
        break;
      }

      const result = townServices.applyAction(targetRun, profile, harness.content, bestAction.id);
      if (!result.ok) {
        break;
      }
    }
  }

  for (let iteration = 0; iteration < maxIterations; iteration += 1) {
    const baseScore = evaluateRunScore(harness, run, policy, { assumeFullResources: false });
    const actions = townServices
      .listActions(harness.content, run, profile)
      .filter((action: TownAction) => isOptimizableTownAction(action));

    let bestAction: TownAction | null = null;
    let bestDelta = 0;

    actions.forEach((action: TownAction) => {
      const clone = cloneRun(harness, run);
      const result = townServices.applyAction(clone, profile, harness.content, action.id);
      if (!result.ok) {
        return;
      }

      if ((action.id || "") === "vendor_refresh_stock") {
        settleGearFollowups(clone, 4, true);
      } else if (isGearFollowupAction(action.id || "")) {
        settleGearFollowups(clone, 4, false);
      }

      const nextScore = evaluateRunScore(harness, clone, policy, { assumeFullResources: false });
      const delta = nextScore - baseScore;
      if (delta > bestDelta) {
        bestDelta = delta;
        bestAction = action;
      }
    });

    if (!bestAction || bestDelta <= 0.05) {
      break;
    }

    const result = townServices.applyAction(run, profile, harness.content, bestAction.id);
    if (!result.ok) {
      break;
    }

    if ((bestAction.id || "") === "vendor_refresh_stock") {
      settleGearFollowups(run, 4, true);
    } else if (isGearFollowupAction(bestAction.id || "")) {
      settleGearFollowups(run, 4, false);
    }
  }
}

function getIncomingThreat(state: CombatState) {
  return state.enemies.reduce((sum, enemy) => {
    if (!enemy.alive || !enemy.currentIntent) {
      return sum;
    }
    const intent = enemy.currentIntent;
    if (ATTACK_INTENT_KINDS.has(intent.kind)) {
      const aoeMultiplier =
        intent.kind === "attack_all" || intent.kind === "attack_burn_all" || intent.kind === "attack_lightning_all" || intent.kind === "attack_poison_all"
          ? 1.35
          : 1;
      const statusBonus =
        intent.kind === "attack_burn" || intent.kind === "attack_burn_all" || intent.kind === "attack_poison" || intent.kind === "attack_poison_all" || intent.kind === "attack_chill"
          ? 2
          : intent.kind === "drain_energy"
            ? 1
            : 0;
      return sum + (Number(intent.value || 0) + statusBonus) * aoeMultiplier;
    }
    if (intent.kind === "charge") {
      const aoeMultiplier = intent.target === "all_allies" ? 1.4 : 1.1;
      const typedThreatBonus =
        intent.damageType === "fire" || intent.damageType === "poison" || intent.damageType === "lightning" || intent.damageType === "cold"
          ? 2
          : 0;
      return sum + (Number(intent.value || 0) + typedThreatBonus) * aoeMultiplier;
    }
    if (intent.kind === "curse_amplify" || intent.kind === "curse_weaken") {
      return sum + 3;
    }
    return sum;
  }, 0);
}

function hasChargeThreat(state: CombatState) {
  return state.enemies.some((enemy) => enemy.alive && enemy.currentIntent?.kind === "charge");
}

function getThreatPressure(state: CombatState) {
  return getIncomingThreat(state) / Math.max(1, state.hero.life + state.hero.guard);
}

function getEnemyStatusScore(state: CombatState) {
  return state.enemies.reduce((sum, enemy) => {
    return (
      sum +
      enemy.burn * STATUS_WEIGHTS.burn +
      enemy.poison * STATUS_WEIGHTS.poison +
      enemy.slow * STATUS_WEIGHTS.slow +
      enemy.freeze * STATUS_WEIGHTS.freeze +
      enemy.stun * STATUS_WEIGHTS.stun +
      enemy.paralyze * STATUS_WEIGHTS.paralyze
    );
  }, 0);
}

function getHeroDebuffScore(state: CombatState) {
  return (
    state.hero.heroBurn * HERO_DEBUFF_WEIGHTS.heroBurn +
    state.hero.heroPoison * HERO_DEBUFF_WEIGHTS.heroPoison +
    state.hero.chill * HERO_DEBUFF_WEIGHTS.chill +
    state.hero.amplify * HERO_DEBUFF_WEIGHTS.amplify +
    state.hero.weaken * HERO_DEBUFF_WEIGHTS.weaken +
    state.hero.energyDrain * HERO_DEBUFF_WEIGHTS.energyDrain
  );
}

function scoreSingleEnemyThreat(enemy: CombatEnemyState) {
  if (!enemy.alive || !enemy.currentIntent) {
    return 0;
  }
  const intent = enemy.currentIntent;
  const baseValue = Number(intent.value || 0);
  if (
    intent.kind === "attack_all" ||
    intent.kind === "attack_burn_all" ||
    intent.kind === "attack_lightning_all" ||
    intent.kind === "attack_poison_all"
  ) {
    return baseValue * 1.45;
  }
  if (intent.kind === "charge") {
    const typedThreatBonus =
      intent.damageType === "fire" || intent.damageType === "poison" || intent.damageType === "lightning" || intent.damageType === "cold"
        ? 2
        : 0;
    return (baseValue + typedThreatBonus) * (intent.target === "all_allies" ? 1.45 : 1.2);
  }
  if (
    intent.kind === "attack" ||
    intent.kind === "attack_burn" ||
    intent.kind === "attack_poison" ||
    intent.kind === "attack_chill" ||
    intent.kind === "sunder_attack" ||
    intent.kind === "drain_attack"
  ) {
    return baseValue;
  }
  if (intent.kind === "curse_amplify" || intent.kind === "curse_weaken") {
    return 4;
  }
  return 1;
}

function getPriorityEnemyTargets(state: CombatState) {
  const aliveEnemies = state.enemies.filter((enemy) => enemy.alive);
  if (aliveEnemies.length <= 2) {
    return aliveEnemies;
  }

  const targets: CombatEnemyState[] = [];
  const addTarget = (enemy: CombatEnemyState | undefined) => {
    if (!enemy || targets.some((candidate) => candidate.id === enemy.id)) {
      return;
    }
    targets.push(enemy);
  };

  addTarget(aliveEnemies.find((enemy) => enemy.id === state.mercenary.markedEnemyId));

  const lowestEffectiveLife = [...aliveEnemies].sort((left, right) => {
    return left.life + left.guard - (right.life + right.guard) || left.id.localeCompare(right.id);
  });
  addTarget(lowestEffectiveLife[0]);

  const highestThreat = [...aliveEnemies].sort((left, right) => {
    return scoreSingleEnemyThreat(right) - scoreSingleEnemyThreat(left) || right.maxLife - left.maxLife || left.id.localeCompare(right.id);
  });
  addTarget(highestThreat[0]);

  if (targets.length < 2) {
    addTarget(lowestEffectiveLife[1]);
  }
  if (targets.length < 3) {
    addTarget(highestThreat[1]);
  }

  return targets.length > 0 ? targets : aliveEnemies.slice(0, 2);
}

function cloneCombatState(state: CombatState) {
  const clone = JSON.parse(JSON.stringify(state)) as CombatState;
  clone.randomFn = state.randomFn;
  return clone;
}

function getHandValue(state: CombatState, content: GameContent, policy: BuildPolicyDefinition, matchingProficiencies: Set<string>) {
  return state.hand.reduce((sum, entry) => {
    return sum + Math.max(0, scoreCard(content.cardCatalog[entry.cardId], policy, matchingProficiencies));
  }, 0);
}

function scoreCombatStateDelta(
  before: CombatState,
  after: CombatState,
  content: GameContent,
  actionType: CombatCandidateAction["type"],
  policy: BuildPolicyDefinition,
  matchingProficiencies: Set<string>
) {
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
  const beforeSafeFromThreat = beforeShortfall <= 0;
  const afterSafeFromThreat = afterShortfall <= 0;

  let score =
    (beforeEnemyLife - afterEnemyLife) * 3.4 +
    (beforeEnemyGuard - afterEnemyGuard) * 1.0 +
    (after.hero.life - before.hero.life) * 2.3 +
    (after.hero.guard - before.hero.guard) * (1.6 + policy.heroGuardWeight * 0.2) +
    (after.mercenary.life - before.mercenary.life) * 0.9 +
    (after.mercenary.guard - before.mercenary.guard) * 0.7 +
    (beforeLivingEnemies - afterLivingEnemies) * 45 +
    (getEnemyStatusScore(after) - getEnemyStatusScore(before)) * 1.5 +
    (getHeroDebuffScore(before) - getHeroDebuffScore(after)) * 2.0 +
    (beforeShortfall - afterShortfall) * (chargeThreat ? 14 : 7) +
    (beforePressure - afterPressure) * (chargeThreat ? 42 : 18) +
    (getHandValue(after, content, policy, matchingProficiencies) - getHandValue(before, content, policy, matchingProficiencies)) * 0.12;

  if (!beforeSafeFromThreat && afterSafeFromThreat) {
    score += chargeThreat ? 42 : 18;
  }
  if (chargeThreat && after.hero.guard > before.hero.guard && afterShortfall < beforeShortfall) {
    score += 10;
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

function listCandidateActions(
  state: CombatState,
  content: GameContent,
  engine: CombatEngineApi,
  policy: BuildPolicyDefinition,
  matchingProficiencies: Set<string>
) {
  const candidates: CombatCandidateAction[] = [];
  const threatPressure = getThreatPressure(state);
  const chargeThreat = hasChargeThreat(state);
  const maxCardEntriesToEvaluate = chargeThreat ? 12 : threatPressure >= 0.5 ? 9 : 6;
  if (state.phase !== "player" || state.outcome) {
    return candidates;
  }

  const playableEntries = state.hand
    .map((entry) => ({
      entry,
      card: content.cardCatalog[entry.cardId],
    }))
    .filter((candidate) => candidate.card && candidate.card.cost <= state.hero.energy)
    .sort((left, right) => {
      return (
        scoreCard(right.card, policy, matchingProficiencies) - scoreCard(left.card, policy, matchingProficiencies) ||
        left.entry.instanceId.localeCompare(right.entry.instanceId)
      );
    })
    .slice(0, maxCardEntriesToEvaluate);

  playableEntries.forEach(({ entry, card }) => {
    if (card.target === "enemy") {
      getPriorityEnemyTargets(state).forEach((enemy) => {
        candidates.push({
          type: "card",
          score: Number.NEGATIVE_INFINITY,
          instanceId: entry.instanceId,
          targetId: enemy.id,
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

  return candidates.map((candidate) => {
    if (candidate.type === "end_turn") {
      const clone = cloneCombatState(state);
      engine.endTurn(clone);
      return {
        ...candidate,
        score: scoreCombatStateDelta(state, clone, content, "end_turn", policy, matchingProficiencies),
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
      return { ...candidate, score: Number.NEGATIVE_INFINITY };
    }

    return {
      ...candidate,
      score: scoreCombatStateDelta(state, clone, content, candidate.type, policy, matchingProficiencies),
    };
  });
}

function chooseBestCombatAction(
  state: CombatState,
  content: GameContent,
  engine: CombatEngineApi,
  policy: BuildPolicyDefinition,
  matchingProficiencies: Set<string>
) {
  const candidates = listCandidateActions(state, content, engine, policy, matchingProficiencies).sort((left, right) => right.score - left.score);
  const best = candidates[0] || { type: "end_turn", score: 0 };
  const endTurnCandidate = candidates.find((candidate) => candidate.type === "end_turn") || null;
  const bestActiveCandidate = candidates.find((candidate) => candidate.type !== "end_turn") || null;
  const chargeThreat = hasChargeThreat(state);
  const threatPressure = getThreatPressure(state);
  if (best.score < 1) {
    if (
      bestActiveCandidate &&
      (chargeThreat || threatPressure >= 0.45) &&
      bestActiveCandidate.score > Number(endTurnCandidate?.score ?? Number.NEGATIVE_INFINITY)
    ) {
      return bestActiveCandidate;
    }
    return { type: "end_turn", score: 0 } as CombatCandidateAction;
  }
  return best;
}

function executeCombatAction(action: CombatCandidateAction, state: CombatState, content: GameContent, engine: CombatEngineApi) {
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

function describeTraceAction(action: CombatCandidateAction, state: CombatState, content: GameContent) {
  if (action.type === "card" && action.instanceId) {
    const entry = state.hand.find((candidate) => candidate.instanceId === action.instanceId) || null;
    const card = entry ? content.cardCatalog[entry.cardId] : null;
    const target = action.targetId ? state.enemies.find((enemy) => enemy.id === action.targetId) : null;
    return target ? `Card: ${card?.title || entry?.cardId || action.instanceId} -> ${target.name}` : `Card: ${card?.title || entry?.cardId || action.instanceId}`;
  }
  if (action.type === "melee") {
    return "Melee strike";
  }
  if (action.type === "potion") {
    return `Potion -> ${action.potionTarget || "hero"}`;
  }
  return "End turn";
}

function describeTraceIntent(intent: EnemyIntent | null | undefined) {
  if (!intent) {
    return "No action";
  }
  if (intent.kind === "charge") {
    const scope = intent.target === "all_allies" ? " all" : intent.target === "mercenary" ? " merc" : "";
    const damageType = intent.damageType ? ` ${intent.damageType}` : "";
    return `${intent.label} (${intent.value}${damageType}${scope} next)`;
  }
  if (typeof intent.value === "number" && intent.value > 0) {
    return `${intent.label || intent.kind} (${intent.value})`;
  }
  return intent.label || intent.kind || "Unknown";
}

function snapshotTraceState(state: CombatState, content: GameContent) {
  return {
    hero: {
      life: state.hero.life,
      maxLife: state.hero.maxLife,
      guard: state.hero.guard,
      energy: state.hero.energy,
      burn: state.hero.heroBurn,
      poison: state.hero.heroPoison,
      chill: state.hero.chill,
      amplify: state.hero.amplify,
      weaken: state.hero.weaken,
      energyDrain: state.hero.energyDrain,
    },
    mercenary: {
      name: state.mercenary.name,
      life: state.mercenary.life,
      maxLife: state.mercenary.maxLife,
      guard: state.mercenary.guard,
      nextAttackBonus: state.mercenary.nextAttackBonus,
      markedEnemyId: state.mercenary.markedEnemyId,
    },
    enemies: state.enemies
      .filter((enemy) => enemy.alive)
      .map((enemy) => ({
        id: enemy.id,
        name: enemy.name,
        life: enemy.life,
        maxLife: enemy.maxLife,
        guard: enemy.guard,
        burn: enemy.burn,
        poison: enemy.poison,
        slow: enemy.slow,
        freeze: enemy.freeze,
        stun: enemy.stun,
        paralyze: enemy.paralyze,
        intent: describeTraceIntent(enemy.currentIntent),
      })),
    hand: state.hand.map((entry) => ({
      instanceId: entry.instanceId,
      cardId: entry.cardId,
      title: content.cardCatalog[entry.cardId]?.title || entry.cardId,
      cost: Number(content.cardCatalog[entry.cardId]?.cost || 0),
    })),
  };
}

export function traceCombatStateWithPolicy(
  harness: ReturnType<typeof createAppHarness>,
  combatState: CombatState,
  policyId: string,
  maxCombatTurns = 36
) {
  const policy = getPolicyDefinitions([policyId])[0];
  const matchingProficiencies = new Set(getMatchingWeaponProficienciesForCombatState(combatState));
  const actionLimitPerTurn = 32;
  const turns: Array<Record<string, unknown>> = [];

  if (!combatState.randomFn) {
    combatState.randomFn = createTrackedRandom(1);
  }

  while (!combatState.outcome && combatState.turn < maxCombatTurns) {
    if (combatState.phase !== "player") {
      harness.combatEngine.endTurn(combatState);
      continue;
    }

    const turnTrace: Record<string, unknown> = {
      turn: combatState.turn,
      start: snapshotTraceState(combatState, harness.content),
      actions: [] as string[],
    };

    let actionsTaken = 0;
    while (combatState.phase === "player" && !combatState.outcome && actionsTaken < actionLimitPerTurn) {
      const action = chooseBestCombatAction(combatState, harness.content, harness.combatEngine, policy, matchingProficiencies);
      (turnTrace.actions as string[]).push(describeTraceAction(action, combatState, harness.content));
      const result = executeCombatAction(action, combatState, harness.content, harness.combatEngine);
      actionsTaken += 1;
      if (!result.ok || action.type === "end_turn") {
        break;
      }
    }

    if (!combatState.outcome && combatState.phase === "player") {
      harness.combatEngine.endTurn(combatState);
    }

    turnTrace.end = snapshotTraceState(combatState, harness.content);
    turnTrace.log = [...combatState.log].slice(0, 16).reverse();
    turns.push(turnTrace);
  }

  return {
    outcome: combatState.outcome || "timeout",
    turns,
    finalState: snapshotTraceState(combatState, harness.content),
    recentLog: [...combatState.log].slice(0, 24).reverse(),
  };
}

function buildCombatStateForEncounter(
  harness: ReturnType<typeof createAppHarness>,
  run: RunState,
  profile: ProfileState,
  encounterId: string,
  seed: number
) {
  const overrides = harness.runFactory.createCombatOverrides(run, harness.content, profile);
  const combatBonuses = harness.itemSystem.buildCombatBonuses(run, harness.content);
  const armorProfile = harness.itemSystem.buildCombatMitigationProfile(run, harness.content) || null;
  const weaponEquipment = getWeaponEquipment(run);
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

function simulateEncounterWithRun(
  harness: ReturnType<typeof createAppHarness>,
  run: RunState,
  profile: ProfileState,
  encounterId: string,
  policy: BuildPolicyDefinition,
  maxTurns: number,
  seed: number
) {
  const combatState = buildCombatStateForEncounter(harness, run, profile, encounterId, seed);
  const matchingProficiencies = new Set(getMatchingWeaponProficienciesForCombatState(combatState));
  const actionLimitPerTurn = 32;

  while (!combatState.outcome && combatState.turn < maxTurns) {
    if (combatState.phase !== "player") {
      harness.combatEngine.endTurn(combatState);
      continue;
    }
    let actionsTaken = 0;
    while (combatState.phase === "player" && !combatState.outcome && actionsTaken < actionLimitPerTurn) {
      const action = chooseBestCombatAction(combatState, harness.content, harness.combatEngine, policy, matchingProficiencies);
      const result = executeCombatAction(action, combatState, harness.content, harness.combatEngine);
      actionsTaken += 1;
      if (!result.ok || action.type === "end_turn") {
        break;
      }
    }
    if (!combatState.outcome && combatState.phase === "player") {
      harness.combatEngine.endTurn(combatState);
    }
  }

  const remainingEnemyLife = combatState.enemies.reduce((sum, enemy) => sum + enemy.life, 0);
  const enemyMaxLife = combatState.enemies.reduce((sum, enemy) => sum + enemy.maxLife, 0);
  return {
    outcome: combatState.outcome || "timeout",
    turns: combatState.turn,
    heroLifePct: combatState.hero.maxLife > 0 ? combatState.hero.life / combatState.hero.maxLife : 0,
    mercenaryLifePct: combatState.mercenary.maxLife > 0 ? combatState.mercenary.life / combatState.mercenary.maxLife : 0,
    enemyLifePct: enemyMaxLife > 0 ? remainingEnemyLife / enemyMaxLife : 0,
  };
}

function getActProbeEncounters(harness: ReturnType<typeof createAppHarness>, actNumber: number) {
  const act = harness.seedBundle.zones.acts?.find((entry: ActSeed) => entry.act === actNumber) || null;
  if (!act) {
    return [];
  }

  const run = harness.runFactory.createRun({
    content: harness.content,
    seedBundle: harness.seedBundle,
    classDefinition: harness.classRegistry.getClassDefinition(harness.seedBundle, "barbarian"),
    heroDefinition: harness.classRegistry.createHeroFromClass(
      harness.content,
      harness.classRegistry.getClassDefinition(harness.seedBundle, "barbarian")
    ),
    mercenaryId: "desert_guard",
    starterDeck: harness.classRegistry.getStarterDeckForClass(harness.content, "barbarian"),
  });
  run.currentActIndex = clamp(actNumber - 1, 0, run.acts.length - 1);
  harness.browserWindow.ROUGE_RUN_ROUTE_BUILDER.syncCurrentActFields(run);
  const currentAct = run.acts[run.currentActIndex];

  const entries = currentAct.zones.flatMap((zone) => {
    return (zone.encounterIds || []).map((encounterId) => {
      const encounter = harness.content.encounterCatalog[encounterId];
      if (!encounter) {
        return null;
      }
      const hasBoss = zone.kind === "boss" || encounter.enemies.some((enemy) => enemy.templateId.endsWith("_boss"));
      const hasElite = zone.kind === "miniboss" || encounter.enemies.some((enemy) => enemy.templateId.includes("_elite"));
      return {
        encounterId,
        encounterName: encounter.name,
        zoneTitle: zone.title,
        kind: hasBoss ? ("boss" as const) : hasElite ? ("elite" as const) : ("battle" as const),
      };
    });
  }).filter(Boolean) as Array<{ encounterId: string; encounterName: string; zoneTitle: string; kind: "boss" | "elite" | "battle" }>;

  const uniqueById = Array.from(new Map(entries.map((entry) => [entry.encounterId, entry])).values());
  const boss = uniqueById.find((entry) => entry.kind === "boss") || null;
  const elite = uniqueById.find((entry) => entry.kind === "elite") || null;
  const battle = [...uniqueById].reverse().find((entry) => entry.kind === "battle") || null;
  return [boss, elite, battle].filter(Boolean) as Array<{ encounterId: string; encounterName: string; zoneTitle: string; kind: "boss" | "elite" | "battle" }>;
}

function summarizeProbeRuns(
  harness: ReturnType<typeof createAppHarness>,
  entry: { encounterId: string; encounterName: string; zoneTitle: string; kind: "boss" | "elite" | "battle" },
  heroPowerScore: number,
  runs: ReturnType<typeof simulateEncounterWithRun>[]
): ProbeEncounterSummary {
  const divisor = Math.max(1, runs.length);
  const wins = runs.filter((result) => result.outcome === "victory").length;
  const enemyPowerScore = scoreEncounterPowerFromDefinition(harness.content, entry.encounterId).total;
  return {
    encounterId: entry.encounterId,
    encounterName: entry.encounterName,
    zoneTitle: entry.zoneTitle,
    kind: entry.kind,
    enemyPowerScore,
    powerDelta: roundTo(heroPowerScore - enemyPowerScore),
    powerRatio: roundTo(heroPowerScore / Math.max(1, enemyPowerScore)),
    runs: runs.length,
    winRate: wins / divisor,
    averageTurns: roundTo(runs.reduce((sum, result) => sum + result.turns, 0) / divisor),
    averageHeroLifePct: roundTo((runs.reduce((sum, result) => sum + result.heroLifePct, 0) / divisor) * 100),
    averageMercenaryLifePct: roundTo((runs.reduce((sum, result) => sum + result.mercenaryLifePct, 0) / divisor) * 100),
    averageEnemyLifePct: roundTo((runs.reduce((sum, result) => sum + result.enemyLifePct, 0) / divisor) * 100),
  };
}

function buildCheckpointSummary(
  harness: ReturnType<typeof createAppHarness>,
  run: RunState,
  profile: ProfileState,
  policy: BuildPolicyDefinition,
  actNumber: number,
  progress: PolicyProgressSummary,
  probeRuns: number,
  maxCombatTurns: number
): SafeZoneCheckpointSummary {
  const scoringRun = createScoringRun(harness, run, true);
  const overrides = harness.runFactory.createCombatOverrides(scoringRun, harness.content, profile);
  const weaponProfile = harness.browserWindow.ROUGE_ITEM_CATALOG.buildEquipmentWeaponProfile(getWeaponEquipment(scoringRun), harness.content) || null;
  const armorProfile = harness.itemSystem.buildCombatMitigationProfile(scoringRun, harness.content);
  const weaponEquipment = getWeaponEquipment(scoringRun);
  const weaponItem = weaponEquipment ? harness.browserWindow.ROUGE_ITEM_CATALOG.getItemDefinition(harness.content, weaponEquipment.itemId) : null;
  const deckStats = buildDeckStats(harness, scoringRun, policy);
  const progressionSummary = harness.runFactory.getProgressionSummary(scoringRun, harness.content);
  const activeRunewords = harness.itemSystem.getActiveRunewords(scoringRun, harness.content) || [];
  const partyPower = scorePartyPower({
    content: harness.content,
    deckCardIds: scoringRun.deck,
    heroState: {
      maxLife: overrides.heroState.maxLife,
      maxEnergy: overrides.heroState.maxEnergy,
      handSize: overrides.heroState.handSize,
      potionHeal: overrides.heroState.potionHeal,
      damageBonus: Number(overrides.heroState.damageBonus || 0),
      guardBonus: Number(overrides.heroState.guardBonus || 0),
      burnBonus: Number(overrides.heroState.burnBonus || 0),
    },
    mercenaryState: {
      maxLife: overrides.mercenaryState.maxLife,
      attack: overrides.mercenaryState.attack,
    },
    weaponProfile,
    armorProfile,
    weaponFamily: weaponItem?.family || "",
    classPreferredFamilies: harness.classRegistry.getPreferredWeaponFamilies(scoringRun.classId) || [],
    gold: scoringRun.gold,
    potions: scoringRun.belt.current,
    level: scoringRun.level,
    bankedSkillPoints: Number(scoringRun.progression?.skillPointsAvailable || 0),
    bankedClassPoints: Number(scoringRun.progression?.classPointsAvailable || 0),
    bankedAttributePoints: Number(scoringRun.progression?.attributePointsAvailable || 0),
    includeCurrentResources: false,
  });
  const probeEntries = getActProbeEncounters(harness, actNumber);
  const probeRunBase = createScoringRun(harness, run, true);
  const probes = probeRuns > 0 ? probeEntries.map((entry, index) => {
    const runs = Array.from({ length: probeRuns }, (_, probeIndex) => {
      const seed = hashString([policy.id, String(actNumber), entry.encounterId, String(index), String(probeIndex)].join("|"));
      return simulateEncounterWithRun(harness, probeRunBase, profile, entry.encounterId, policy, maxCombatTurns, seed);
    });
    return summarizeProbeRuns(harness, entry, partyPower.total, runs);
  }) : [];

  return {
    checkpointId: `act_${actNumber}_safe_zone`,
    label: `Act ${actNumber} Safe Zone`,
    actNumber,
    level: run.level,
    gold: run.gold,
    powerScore: partyPower.total,
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
    deckSize: run.deck.length,
    topCards: deckStats.topCards,
    deckProficiencies: Object.entries(deckStats.proficiencyCounts)
      .sort((left, right) => right[1] - left[1] || left[0].localeCompare(right[0]))
      .slice(0, 5)
      .map(([proficiency, count]) => ({ proficiency, count })),
    hero: {
      maxLife: overrides.heroState.maxLife,
      maxEnergy: overrides.heroState.maxEnergy,
      handSize: overrides.heroState.handSize,
      potionHeal: overrides.heroState.potionHeal,
      damageBonus: Number(overrides.heroState.damageBonus || 0),
      guardBonus: Number(overrides.heroState.guardBonus || 0),
      burnBonus: Number(overrides.heroState.burnBonus || 0),
    },
    mercenary: {
      name: run.mercenary.name,
      maxLife: overrides.mercenaryState.maxLife,
      attack: overrides.mercenaryState.attack,
    },
    attributes: { ...(run.progression?.attributes || {}) },
    training: { ...(run.progression?.training || {}) },
    favoredTreeId: progressionSummary?.favoredTreeId || "",
    favoredTreeName: progressionSummary?.favoredTreeName || "",
    dominantArchetypeId: progressionSummary?.dominantArchetypeId || "",
    dominantArchetypeLabel: progressionSummary?.dominantArchetypeLabel || "",
    dominantArchetypeScore: Number(progressionSummary?.dominantArchetypeScore || 0),
    secondaryArchetypeId: progressionSummary?.secondaryArchetypeId || "",
    secondaryArchetypeLabel: progressionSummary?.secondaryArchetypeLabel || "",
    secondaryArchetypeScore: Number(progressionSummary?.secondaryArchetypeScore || 0),
    archetypeScores: Array.isArray(progressionSummary?.archetypeScores)
      ? progressionSummary.archetypeScores.map((entry) => ({
          archetypeId: entry.archetypeId,
          label: entry.label,
          score: Number(entry.score || 0),
        }))
      : [],
    weapon: weaponEquipment
      ? {
          itemId: weaponEquipment.itemId,
          name: weaponItem?.name || weaponEquipment.itemId,
          family: weaponItem?.family || "",
          rarity: weaponEquipment.rarity || "white",
        }
      : null,
    activeRunewords,
    runewordsForged: Number(scoringRun.summary?.runewordsForged || 0),
    armor: {
      resistances: (armorProfile?.resistances || []).map((entry) => ({
        type: entry.type,
        amount: Number(entry.amount || 0),
      })),
      immunities: [...(armorProfile?.immunities || [])],
    },
    choiceCounts: { ...progress.actionCounts },
    probes,
  };
}

function buildFinalBuildSummary(
  harness: ReturnType<typeof createAppHarness>,
  run: RunState,
  profile: ProfileState,
  policy: BuildPolicyDefinition
): FinalBuildSummary {
  const scoringRun = createScoringRun(harness, run, true);
  const progressionSummary = harness.runFactory.getProgressionSummary(scoringRun, harness.content);
  const overrides = harness.runFactory.createCombatOverrides(scoringRun, harness.content, profile);
  const weaponEquipment = getWeaponEquipment(scoringRun);
  const armorEquipment = getArmorEquipment(scoringRun);
  const weaponItem = weaponEquipment ? harness.browserWindow.ROUGE_ITEM_CATALOG.getItemDefinition(harness.content, weaponEquipment.itemId) : null;
  const armorItem = armorEquipment ? harness.browserWindow.ROUGE_ITEM_CATALOG.getItemDefinition(harness.content, armorEquipment.itemId) : null;
  const weaponProfile = harness.browserWindow.ROUGE_ITEM_CATALOG.buildEquipmentWeaponProfile(weaponEquipment, harness.content) || null;
  const armorProfile = harness.itemSystem.buildCombatMitigationProfile(scoringRun, harness.content) || null;
  const activeRunewords = harness.itemSystem.getActiveRunewords(scoringRun, harness.content) || [];
  const deckStats = buildDeckStats(harness, scoringRun, policy);
  const preferredFamilies = harness.classRegistry.getPreferredWeaponFamilies(scoringRun.classId) || [];

  return {
    level: scoringRun.level,
    deckSize: scoringRun.deck.length,
    topCards: deckStats.topCards,
    deckProficiencies: Object.entries(deckStats.proficiencyCounts)
      .sort((left, right) => right[1] - left[1] || left[0].localeCompare(right[0]))
      .slice(0, 5)
      .map(([proficiency, count]) => ({ proficiency, count })),
    hero: {
      maxLife: overrides.heroState.maxLife,
      maxEnergy: overrides.heroState.maxEnergy,
      handSize: overrides.heroState.handSize,
      potionHeal: overrides.heroState.potionHeal,
      damageBonus: Number(overrides.heroState.damageBonus || 0),
      guardBonus: Number(overrides.heroState.guardBonus || 0),
      burnBonus: Number(overrides.heroState.burnBonus || 0),
    },
    mercenary: {
      name: scoringRun.mercenary.name,
      maxLife: overrides.mercenaryState.maxLife,
      attack: overrides.mercenaryState.attack,
    },
    weapon: weaponEquipment
      ? {
          itemId: weaponEquipment.itemId,
          name: weaponItem?.name || weaponEquipment.itemId,
          family: weaponItem?.family || "",
          rarity: weaponEquipment.rarity || "white",
          preferredForClass: preferredFamilies.includes(weaponItem?.family || ""),
          damageTypes: (weaponProfile?.typedDamage || []).map((entry) => ({
            type: entry.type,
            amount: Number(entry.amount || 0),
          })),
          effects: (weaponProfile?.effects || []).map((entry) => ({
            kind: entry.kind,
            amount: Number(entry.amount || 0),
          })),
        }
      : null,
    armor: armorEquipment
      ? {
          itemId: armorEquipment.itemId,
          name: armorItem?.name || armorEquipment.itemId,
          rarity: armorEquipment.rarity || "white",
          resistances: (armorProfile?.resistances || []).map((entry) => ({
            type: entry.type,
            amount: Number(entry.amount || 0),
          })),
          immunities: [...(armorProfile?.immunities || [])],
        }
      : null,
    favoredTreeId: progressionSummary?.favoredTreeId || "",
    favoredTreeName: progressionSummary?.favoredTreeName || "",
    dominantArchetypeId: progressionSummary?.dominantArchetypeId || "",
    dominantArchetypeLabel: progressionSummary?.dominantArchetypeLabel || "",
    dominantArchetypeScore: Number(progressionSummary?.dominantArchetypeScore || 0),
    secondaryArchetypeId: progressionSummary?.secondaryArchetypeId || "",
    secondaryArchetypeLabel: progressionSummary?.secondaryArchetypeLabel || "",
    secondaryArchetypeScore: Number(progressionSummary?.secondaryArchetypeScore || 0),
    archetypeScores: Array.isArray(progressionSummary?.archetypeScores)
      ? progressionSummary.archetypeScores.map((entry) => ({
          archetypeId: entry.archetypeId,
          label: entry.label,
          score: Number(entry.score || 0),
        }))
      : [],
    activeRunewords,
  };
}

function buildWorldProgressSummary(run: RunState): WorldProgressSummary {
  const questOutcomes = Object.values(run.world?.questOutcomes || {});
  return {
    resolvedNodeCount: Array.isArray(run.world?.resolvedNodeIds) ? run.world.resolvedNodeIds.length : 0,
    worldFlagCount: Array.isArray(run.world?.worldFlags) ? run.world.worldFlags.length : 0,
    questOutcomes: questOutcomes.length,
    questFollowUpsResolved: questOutcomes.filter((entry) => Boolean(entry.followUpNodeId)).length,
    questChainsResolved: questOutcomes.filter((entry) => entry.status === "chain_resolved").length,
    shrineOutcomes: Object.keys(run.world?.shrineOutcomes || {}).length,
    eventOutcomes: Object.keys(run.world?.eventOutcomes || {}).length,
    opportunityOutcomes: Object.keys(run.world?.opportunityOutcomes || {}).length,
  };
}

function buildEncounterMetricsByKind(encounters: EncounterRunMetric[]) {
  const byKind: Record<string, EncounterRunMetric[]> = {};
  encounters.forEach((entry) => {
    const kind = entry.kind || "battle";
    byKind[kind] = byKind[kind] || [];
    byKind[kind].push(entry);
  });

  return Object.fromEntries(
    Object.entries(byKind).map(([kind, entries]) => {
      const count = Math.max(1, entries.length);
      const wins = entries.filter((entry) => entry.outcome === "victory").length;
      return [kind, {
        count: entries.length,
        winRate: roundTo(wins / count, 3),
        averageTurns: roundTo(entries.reduce((sum, entry) => sum + Number(entry.turns || 0), 0) / count),
        averageHeroLifePct: roundTo(entries.reduce((sum, entry) => sum + Number(entry.heroLifePct || 0), 0) / count),
        averageMercenaryLifePct: roundTo(entries.reduce((sum, entry) => sum + Number(entry.mercenaryLifePct || 0), 0) / count),
        averageEnemyLifePct: roundTo(entries.reduce((sum, entry) => sum + Number(entry.enemyLifePct || 0), 0) / count),
        averagePowerRatio: roundTo(entries.reduce((sum, entry) => sum + Number(entry.powerRatio || 0), 0) / count),
      }];
    })
  );
}

function buildPolicyRunSummary(
  harness: ReturnType<typeof createAppHarness>,
  run: RunState,
  profile: ProfileState,
  policy: BuildPolicyDefinition,
  progress: PolicyProgressSummary
): PolicyRunSummary {
  return {
    runSummary: {
      ...run.summary,
    },
    zoneKindCounts: { ...progress.zoneKindCounts },
    zoneRoleCounts: { ...progress.zoneRoleCounts },
    nodeTypeCounts: { ...progress.nodeTypeCounts },
    rewardKindCounts: { ...progress.rewardKindCounts },
    choiceKindCounts: { ...progress.actionCounts },
    rewardEffectCounts: { ...progress.rewardEffectCounts },
    rewardRoleCounts: { ...progress.rewardRoleCounts },
    strategyRoleCounts: { ...progress.strategyRoleCounts },
    encounterResults: progress.encounterResults.map((entry) => ({ ...entry })),
    encounterMetricsByKind: buildEncounterMetricsByKind(progress.encounterResults),
    world: buildWorldProgressSummary(run),
    finalBuild: buildFinalBuildSummary(harness, run, profile, policy),
  };
}

function chooseBestRewardChoice(
  harness: ReturnType<typeof createAppHarness>,
  run: RunState,
  _profile: ProfileState,
  reward: RunReward,
  policy: BuildPolicyDefinition
) {
  const deepClone = harness.browserWindow.ROUGE_UTILS.deepClone as <T>(value: T) => T;
  const choices = Array.isArray(reward.choices) ? reward.choices : [];
  let bestChoice = choices[0] || null;
  let bestScore = Number.NEGATIVE_INFINITY;

  choices.forEach((choice) => {
    const runClone = cloneRun(harness, run);
    const rewardClone = deepClone(reward);
    const applyResult = harness.runFactory.applyReward(runClone, rewardClone, choice.id, harness.content);
    if (!applyResult.ok) {
      return;
    }

    const assumeFullResources = reward.endsAct || reward.clearsZone;
    if (reward.endsAct && runClone.currentActIndex < runClone.acts.length - 1) {
      harness.runFactory.advanceToNextAct(runClone, harness.content);
    }

    const score = evaluateRunScore(harness, runClone, policy, { assumeFullResources });
    if (score > bestScore) {
      bestScore = score;
      bestChoice = choice;
    }
  });

  return bestChoice;
}

function countSelectedZone(progress: PolicyProgressSummary, zone: ZoneState | null) {
  if (!zone) {
    return;
  }
  incrementCount(progress.zoneKindCounts, zone.kind || "unknown");
  incrementCount(progress.zoneRoleCounts, zone.zoneRole || "unknown");
  incrementCount(progress.nodeTypeCounts, zone.nodeType || zone.kind || "unknown");
}

function countChoice(progress: PolicyProgressSummary, reward: RunReward | null, choice: RewardChoice | null) {
  if (reward) {
    incrementCount(progress.rewardKindCounts, reward.kind || "unknown");
  }
  if (!choice) {
    return;
  }
  incrementCount(progress.actionCounts, choice.kind || "unknown");
  incrementCount(progress.rewardRoleCounts, choice.cardRewardRole || "none");
  incrementCount(progress.strategyRoleCounts, choice.strategyRole || "none");
  (Array.isArray(choice.effects) ? choice.effects : []).forEach((effect) => {
    incrementCount(progress.rewardEffectCounts, effect.kind || "unknown");
  });
}

function getZoneUnlockValue(run: RunState, zone: ZoneState) {
  const currentAct = run.acts[run.currentActIndex];
  return currentAct.zones.reduce((sum, candidate) => {
    return !candidate.cleared && Array.isArray(candidate.prerequisites) && candidate.prerequisites.includes(zone.id) ? sum + 1 : sum;
  }, 0);
}

function chooseNextZone(run: RunState, reachableZones: ZoneState[]) {
  const nonBoss = reachableZones.filter((zone) => zone.kind !== "boss");
  const pool = nonBoss.length > 0 ? nonBoss : reachableZones;
  return pool
    .slice()
    .sort((left, right) => {
      const leftWorldNodeScore =
        (left.kind === "quest" ? 500 : 0) +
        (left.kind === "shrine" ? 470 : 0) +
        (left.kind === "event" ? 440 : 0) +
        (left.kind === "opportunity" ? 410 : 0);
      const rightWorldNodeScore =
        (right.kind === "quest" ? 500 : 0) +
        (right.kind === "shrine" ? 470 : 0) +
        (right.kind === "event" ? 440 : 0) +
        (right.kind === "opportunity" ? 410 : 0);
      const leftScore =
        leftWorldNodeScore +
        (left.kind === "miniboss" ? 320 : 0) +
        (left.zoneRole === "branchBattle" ? 280 : 0) +
        (left.zoneRole === "opening" ? 220 : 0) +
        getZoneUnlockValue(run, left) * 30 -
        left.encountersCleared * 4;
      const rightScore =
        rightWorldNodeScore +
        (right.kind === "miniboss" ? 320 : 0) +
        (right.zoneRole === "branchBattle" ? 280 : 0) +
        (right.zoneRole === "opening" ? 220 : 0) +
        getZoneUnlockValue(run, right) * 30 -
        right.encountersCleared * 4;
      return rightScore - leftScore || left.title.localeCompare(right.title);
    })[0];
}

function playStateCombat(
  harness: ReturnType<typeof createAppHarness>,
  state: AppState,
  policy: BuildPolicyDefinition,
  maxCombatTurns: number
) {
  if (!state.combat) {
    return null;
  }
  const startingEnemyLife = state.combat.enemies.reduce((sum, enemy) => sum + Number(enemy.life || 0), 0);
  const matchingProficiencies = new Set(getMatchingWeaponProficienciesForCombatState(state.combat));
  const actionLimitPerTurn = 32;

  while (!state.combat.outcome && state.combat.turn < maxCombatTurns) {
    if (state.combat.phase !== "player") {
      harness.combatEngine.endTurn(state.combat);
      continue;
    }
    let actionsTaken = 0;
    while (state.combat.phase === "player" && !state.combat.outcome && actionsTaken < actionLimitPerTurn) {
      const action = chooseBestCombatAction(state.combat, harness.content, harness.combatEngine, policy, matchingProficiencies);
      const result = executeCombatAction(action, state.combat, harness.content, harness.combatEngine);
      actionsTaken += 1;
      if (!result.ok || action.type === "end_turn") {
        break;
      }
    }
    if (!state.combat.outcome && state.combat.phase === "player") {
      harness.combatEngine.endTurn(state.combat);
    }
  }

  if (!state.combat.outcome) {
    state.combat.outcome = "defeat";
  }
  const remainingEnemyLife = state.combat.enemies.reduce((sum, enemy) => sum + Number(enemy.life || 0), 0);
  return {
    outcome: state.combat.outcome || "defeat",
    turns: Number(state.combat.turn || 0),
    heroLifePct: state.combat.hero.maxLife > 0 ? roundTo((Number(state.combat.hero.life || 0) / Number(state.combat.hero.maxLife || 1)) * 100) : 0,
    mercenaryLifePct:
      state.combat.mercenary.maxLife > 0
        ? roundTo((Number(state.combat.mercenary.life || 0) / Number(state.combat.mercenary.maxLife || 1)) * 100)
        : 0,
    enemyLifePct: startingEnemyLife > 0 ? roundTo((remainingEnemyLife / startingEnemyLife) * 100) : 0,
  };
}

export function createSimulationState(
  harness: ReturnType<typeof createAppHarness>,
  classId: string,
  seed: number
) {
  const mercenaryId = getMercenaryIdForClass(classId);
  const state = harness.appEngine.createAppState({
    content: harness.content,
    seedBundle: harness.seedBundle,
    combatEngine: harness.combatEngine,
    randomFn: createSeededRandom(seed),
  });
  harness.appEngine.startCharacterSelect(state);
  harness.appEngine.setSelectedClass(state, classId);
  harness.appEngine.setSelectedMercenary(state, mercenaryId);
  const startResult = harness.appEngine.startRun(state);
  if (!startResult.ok || !state.run) {
    throw new Error(startResult.message || `Could not start run for class ${classId}.`);
  }
  return state;
}

export function createSimulationStateFromSnapshot(
  harness: ReturnType<typeof createAppHarness>,
  serializedSnapshot: string,
  randomSeed: number,
  randomState?: number
) {
  const state = harness.appEngine.createAppState({
    content: harness.content,
    seedBundle: harness.seedBundle,
    combatEngine: harness.combatEngine,
    randomFn: createTrackedRandom(randomSeed, randomState),
  });
  const result = harness.appEngine.loadRunSnapshot(state, serializedSnapshot);
  if (!result.ok || !state.run) {
    throw new Error(result.message || "Could not restore simulation snapshot.");
  }
  return state;
}

function createEmptyPolicyProgressSummary(): PolicyProgressSummary {
  return {
    actionCounts: {},
    rewardKindCounts: {},
    rewardEffectCounts: {},
    rewardRoleCounts: {},
    strategyRoleCounts: {},
    zoneKindCounts: {},
    zoneRoleCounts: {},
    nodeTypeCounts: {},
    encounterResults: [],
  };
}

function getPolicySimulationAssumptions() {
  return [
    "Uses the live run/reward/combat runtime with a full-clear route and boss-last ordering.",
    "Reward and safe-zone choices are selected by greedy lookahead against a static power score.",
    "Safe-zone optimization currently covers progression spending, healing, belt refills, mercenary contract actions, vendor refresh/buy/equip lines, rune socketing/commission, blacksmith evolutions, and sage purges.",
    "Randomized town actions such as sage transforms and gambler purchases are still excluded from the optimizer.",
  ];
}

function cloneContinuationContext(context: RunProgressionContinuationContext): RunProgressionContinuationContext {
  return JSON.parse(JSON.stringify(context)) as RunProgressionContinuationContext;
}

function buildEncounterMetric(
  harness: ReturnType<typeof createAppHarness>,
  run: RunState,
  encounter: SimulationFailureSummary | null,
  combatResult: ReturnType<typeof playStateCombat>
): EncounterRunMetric | null {
  if (!encounter || !combatResult) {
    return null;
  }
  const overrides = harness.runFactory.createCombatOverrides(run, harness.content, null);
  const armorProfile = harness.itemSystem.buildCombatMitigationProfile(run, harness.content) || null;
  const weaponEquipment = getWeaponEquipment(run);
  const weaponItemId = weaponEquipment?.itemId || "";
  const weaponProfile = harness.browserWindow.ROUGE_ITEM_CATALOG.buildEquipmentWeaponProfile(weaponEquipment, harness.content) || null;
  const weaponFamily = harness.browserWindow.ROUGE_ITEM_CATALOG.getWeaponFamily(weaponItemId, harness.content) || "";
  const classPreferredFamilies = harness.classRegistry.getPreferredWeaponFamilies(run.classId) || [];
  const heroPowerScore = scorePartyPower({
    content: harness.content,
    deckCardIds: run.deck,
    heroState: {
      ...overrides.heroState,
      life: run.hero.currentLife,
      currentLife: run.hero.currentLife,
    },
    mercenaryState: {
      ...overrides.mercenaryState,
      life: run.mercenary.currentLife,
      currentLife: run.mercenary.currentLife,
    },
    weaponProfile,
    armorProfile,
    weaponFamily,
    classPreferredFamilies,
    gold: run.gold,
    potions: run.belt.current,
    level: run.level,
    bankedSkillPoints: run.progression?.skillPointsAvailable || 0,
    bankedClassPoints: run.progression?.classPointsAvailable || 0,
    bankedAttributePoints: run.progression?.attributePointsAvailable || 0,
    includeCurrentResources: true,
  }).total;
  const enemyPowerScore = scoreEncounterPowerFromDefinition(harness.content, encounter.encounterId).total;
  return {
    actNumber: encounter.actNumber,
    encounterId: encounter.encounterId,
    encounterName: encounter.encounterName,
    zoneTitle: encounter.zoneTitle,
    kind: encounter.kind || "battle",
    zoneKind: encounter.zoneKind || "",
    zoneRole: encounter.zoneRole || "",
    outcome: String(combatResult.outcome || "defeat"),
    turns: Number(combatResult.turns || 0),
    heroLifePct: Number(combatResult.heroLifePct || 0),
    mercenaryLifePct: Number(combatResult.mercenaryLifePct || 0),
    enemyLifePct: Number(combatResult.enemyLifePct || 0),
    heroPowerScore: roundTo(heroPowerScore),
    enemyPowerScore: roundTo(enemyPowerScore),
    powerRatio: roundTo(heroPowerScore / Math.max(1, enemyPowerScore)),
  };
}

export function runProgressionPolicyFromState(
  harness: ReturnType<typeof createAppHarness>,
  state: AppState,
  classId: string,
  policy: BuildPolicyDefinition,
  throughActNumber: number,
  probeRuns: number,
  maxCombatTurns: number,
  seedOffset = 0,
  continuation?: Partial<RunProgressionContinuationContext>,
  hooks?: PolicySimulationHooks
): PolicySimulationReport {
  const PHASES = harness.appEngine.PHASES;
  const checkpoints = Array.isArray(continuation?.checkpoints) ? continuation.checkpoints.map((entry) => ({ ...entry })) : [];
  const progress = continuation?.progress
    ? JSON.parse(JSON.stringify(continuation.progress)) as PolicyProgressSummary
    : createEmptyPolicyProgressSummary();
  let failure: SimulationFailureSummary | null = continuation?.failure ? { ...continuation.failure } : null;
  let lastEncounterContext: SimulationFailureSummary | null = continuation?.lastEncounterContext
    ? { ...continuation.lastEncounterContext }
    : null;

  const continuationContext = () => cloneContinuationContext({
    policyId: policy.id,
    throughActNumber,
    probeRuns,
    maxCombatTurns,
    seedOffset,
    progress,
    checkpoints,
    failure,
    lastEncounterContext,
  });

  if (!continuation) {
    optimizeSafeZoneRun(harness, state.run as RunState, state.profile, policy);
    const initialCheckpoint = buildCheckpointSummary(
      harness,
      state.run as RunState,
      state.profile,
      policy,
      state.run!.actNumber,
      progress,
      probeRuns,
      maxCombatTurns
    );
    checkpoints.push(initialCheckpoint);
    hooks?.onInitialized?.({
      state,
      harness,
      policy,
      classId,
      seedOffset,
      continuationContext: continuationContext(),
    });
    hooks?.onCheckpoint?.({
      state,
      harness,
      policy,
      classId,
      seedOffset,
      checkpoint: initialCheckpoint,
      continuationContext: continuationContext(),
    });
  } else {
    hooks?.onInitialized?.({
      state,
      harness,
      policy,
      classId,
      seedOffset,
      continuationContext: continuationContext(),
    });
  }

  while (state.run) {
    if (state.phase === PHASES.SAFE_ZONE) {
      if (state.run.actNumber >= throughActNumber && throughActNumber < 5) {
        const report: PolicySimulationReport = {
          policyId: policy.id,
          policyLabel: policy.label,
          description: policy.description,
          assumptions: getPolicySimulationAssumptions(),
          outcome: "reached_checkpoint",
          finalActNumber: state.run.actNumber,
          finalLevel: state.run.level,
          checkpoints,
          failure: null,
          summary: buildPolicyRunSummary(harness, state.run, state.profile, policy, progress),
        };
        hooks?.onRunComplete?.({
          state,
          harness,
          policy,
          classId,
          seedOffset,
          report,
          continuationContext: continuationContext(),
        });
        return report;
      }

      const leaveResult = harness.appEngine.leaveSafeZone(state);
      if (!leaveResult.ok) {
        throw new Error(leaveResult.message || "Could not leave safe zone.");
      }
      continue;
    }

    if (state.phase === PHASES.WORLD_MAP) {
      const needsTown =
        state.run.hero.currentLife <= Math.ceil(state.run.hero.maxLife * 0.5) ||
        state.run.belt.current <= 0 ||
        state.run.mercenary.currentLife <= 0;
      if (needsTown) {
        const returnResult = harness.appEngine.returnToSafeZone(state);
        if (returnResult.ok) {
          optimizeSafeZoneRun(harness, state.run, state.profile, policy);
          continue;
        }
      }

      const reachableZones = harness.runFactory.getReachableZones(state.run);
      if (reachableZones.length === 0) {
        throw new Error(`No reachable zones remain in Act ${state.run.actNumber}.`);
      }
      let selectedZone: ZoneState | null = null;
      let lastSelectMessage = "";
      const candidates = reachableZones.slice();
      while (candidates.length > 0 && !selectedZone) {
        const nextZone = chooseNextZone(state.run, candidates);
        const selectResult = harness.appEngine.selectZone(state, nextZone.id);
        if (selectResult.ok) {
          selectedZone = nextZone;
          countSelectedZone(progress, selectedZone);
          break;
        }
        lastSelectMessage = selectResult.message || `Could not select zone ${nextZone.id}.`;
        const candidateIndex = candidates.findIndex((zone) => zone.id === nextZone.id);
        if (candidateIndex >= 0) {
          candidates.splice(candidateIndex, 1);
        } else {
          break;
        }
      }
      if (!selectedZone) {
        throw new Error(lastSelectMessage || `Could not select any reachable zone in Act ${state.run.actNumber}.`);
      }
      if (state.phase === PHASES.ENCOUNTER) {
        const encounter = harness.content.encounterCatalog[state.run.activeEncounterId];
        lastEncounterContext = {
          actNumber: state.run.actNumber,
          zoneTitle: selectedZone.title,
          encounterId: state.run.activeEncounterId,
          encounterName: encounter?.name || state.run.activeEncounterId,
          kind: selectedZone.kind === "boss" ? "boss" : selectedZone.kind === "miniboss" ? "elite" : "battle",
          zoneKind: selectedZone.kind || "",
          zoneRole: selectedZone.zoneRole || "",
          nodeType: selectedZone.nodeType || "",
        };
        hooks?.onEncounterStart?.({
          state,
          harness,
          policy,
          classId,
          seedOffset,
          encounter: { ...lastEncounterContext },
          continuationContext: continuationContext(),
        });
      }
      continue;
    }

    if (state.phase === PHASES.ENCOUNTER) {
      const combatResult = playStateCombat(harness, state, policy, maxCombatTurns);
      const encounterMetric = buildEncounterMetric(harness, state.run, lastEncounterContext, combatResult);
      if (encounterMetric) {
        progress.encounterResults.push(encounterMetric);
      }
      const outcomeResult = harness.appEngine.syncEncounterOutcome(state);
      if (!outcomeResult.ok) {
        throw new Error(outcomeResult.message || "Could not sync encounter outcome.");
      }
      if (state.phase === PHASES.RUN_FAILED) {
        failure = lastEncounterContext;
        const report: PolicySimulationReport = {
          policyId: policy.id,
          policyLabel: policy.label,
          description: policy.description,
          assumptions: getPolicySimulationAssumptions(),
          outcome: "run_failed",
          finalActNumber: failure?.actNumber || state.run?.actNumber || 1,
          finalLevel: state.run?.level || 1,
          checkpoints,
          failure,
          summary: buildPolicyRunSummary(harness, state.run as RunState, state.profile, policy, progress),
        };
        hooks?.onRunFailure?.({
          state,
          harness,
          policy,
          classId,
          seedOffset,
          failure,
          report,
          continuationContext: continuationContext(),
        });
        return report;
      }
      continue;
    }

    if (state.phase === PHASES.REWARD) {
      const reward = state.run.pendingReward;
      if (!reward) {
        throw new Error("Reward phase is active without a pending reward.");
      }
      const primaryChoice = chooseBestRewardChoice(harness, state.run, state.profile, reward, policy);
      const orderedChoices = [
        primaryChoice,
        ...((Array.isArray(reward.choices) ? reward.choices : []).filter((choice) => choice.id !== primaryChoice?.id)),
      ].filter(Boolean) as RewardChoice[];
      let claimed = false;
      let lastClaimMessage = "";
      let lastChoiceSummary = "";
      for (const choice of orderedChoices) {
        let attempts = 0;
        while (attempts <= ((state.run.inventory?.carried?.length || 0) + 1)) {
          const claimResult = harness.appEngine.claimRewardAndAdvance(state, choice?.id || "");
          if (claimResult.ok) {
            countChoice(progress, reward, choice);
            claimed = true;
            break;
          }
          lastClaimMessage = claimResult.message || "Could not claim reward.";
          lastChoiceSummary = `${reward.title} -> ${choice?.title || choice?.id || "choice"} (${(choice?.effects || []).map((effect) => effect.kind).join(", ")})`;
          if (!lastClaimMessage.includes("Not enough inventory space")) {
            console.error(`Reward claim failed: ${lastClaimMessage} [${lastChoiceSummary}]`);
            break;
          }
          if (!discardLowestValueCarriedEntry(harness, state.run)) {
            break;
          }
          attempts += 1;
        }
        if (claimed) {
          break;
        }
      }
      if (!claimed) {
        throw new Error(`${lastClaimMessage || "Could not claim reward."} [${lastChoiceSummary}]`);
      }
      continue;
    }

    if (state.phase === PHASES.ACT_TRANSITION) {
      if (state.run?.guide?.overlayKind === "reward") {
        const guideResult = harness.appEngine.continueActGuide(state);
        if (!guideResult.ok) {
          throw new Error(guideResult.message || "Could not dismiss act guide.");
        }
        if (state.run?.guide?.overlayKind === "reward") {
          state.run.guide.overlayKind = "";
          state.run.guide.targetActNumber = 0;
        }
      }
      const continueResult = harness.appEngine.continueActTransition(state);
      if (!continueResult.ok) {
        throw new Error(continueResult.message || "Could not continue act transition.");
      }
      optimizeSafeZoneRun(harness, state.run, state.profile, policy);
      const checkpoint = buildCheckpointSummary(harness, state.run, state.profile, policy, state.run.actNumber, progress, probeRuns, maxCombatTurns);
      checkpoints.push(checkpoint);
      hooks?.onCheckpoint?.({
        state,
        harness,
        policy,
        classId,
        seedOffset,
        checkpoint,
        continuationContext: continuationContext(),
      });
      continue;
    }

    if (state.phase === PHASES.RUN_COMPLETE) {
      const report: PolicySimulationReport = {
        policyId: policy.id,
        policyLabel: policy.label,
        description: policy.description,
        assumptions: getPolicySimulationAssumptions(),
        outcome: "run_complete",
        finalActNumber: state.run.actNumber,
        finalLevel: state.run.level,
        checkpoints,
        failure: null,
        summary: buildPolicyRunSummary(harness, state.run, state.profile, policy, progress),
      };
      hooks?.onRunComplete?.({
        state,
        harness,
        policy,
        classId,
        seedOffset,
        report,
        continuationContext: continuationContext(),
      });
      return report;
    }

    throw new Error(`Unsupported simulation phase: ${state.phase}`);
  }

  throw new Error("Simulation exited without an active run.");
}

function simulatePolicyRun(
  harness: ReturnType<typeof createAppHarness>,
  classId: string,
  policy: BuildPolicyDefinition,
  throughActNumber: number,
  probeRuns: number,
  maxCombatTurns: number,
  seedOffset = 0,
  hooks?: PolicySimulationHooks
): PolicySimulationReport {
  const seed = createProgressionSimulationSeed(classId, policy.id, throughActNumber, seedOffset);
  const state = createSimulationState(harness, classId, seed);
  return runProgressionPolicyFromState(harness, state, classId, policy, throughActNumber, probeRuns, maxCombatTurns, seedOffset, undefined, hooks);
}

export function getRunProgressionPolicyDefinitions() {
  return Object.values(BUILD_POLICIES).map((policy) => ({ ...policy }));
}

export function runProgressionEncounterTrace(options: {
  classId?: string;
  policyId?: string;
  targetActNumber?: number;
  encounterId?: string;
  seedOffset?: number;
  maxCombatTurns?: number;
} = {}) {
  const classId = String(options.classId || "druid");
  const targetActNumber = clamp(options.targetActNumber || 4, 1, 5);
  const encounterId = String(options.encounterId || `act_${targetActNumber}_boss`);
  const seedOffset = Math.max(0, options.seedOffset || 0);
  const maxCombatTurns = Math.max(12, options.maxCombatTurns || 36);
  const policy = getPolicyDefinitions([options.policyId || "aggressive"])[0];
  const seed = hashString([classId, policy.id, "5", String(seedOffset)].join("|"));
  const harness = createQuietAppHarness();
  const state = createSimulationState(harness, classId, seed);
  const PHASES = harness.appEngine.PHASES;

  optimizeSafeZoneRun(harness, state.run as RunState, state.profile, policy);

  let encounterContext: { actNumber: number; zoneTitle: string; encounterId: string; encounterName: string } | null = null;

  while (state.run) {
    if (state.phase === PHASES.SAFE_ZONE) {
      const leaveResult = harness.appEngine.leaveSafeZone(state);
      if (!leaveResult.ok) {
        throw new Error(leaveResult.message || "Could not leave safe zone.");
      }
      continue;
    }

    if (state.phase === PHASES.WORLD_MAP) {
      const needsTown =
        state.run.hero.currentLife <= Math.ceil(state.run.hero.maxLife * 0.5) ||
        state.run.belt.current <= 0 ||
        state.run.mercenary.currentLife <= 0;
      if (needsTown) {
        const returnResult = harness.appEngine.returnToSafeZone(state);
        if (returnResult.ok) {
          optimizeSafeZoneRun(harness, state.run, state.profile, policy);
          continue;
        }
      }

      const reachableZones = harness.runFactory.getReachableZones(state.run);
      if (reachableZones.length === 0) {
        throw new Error(`No reachable zones remain in Act ${state.run.actNumber}.`);
      }

      let selectedZone: ZoneState | null = null;
      let lastSelectMessage = "";
      const candidates = reachableZones.slice();
      while (candidates.length > 0 && !selectedZone) {
        const nextZone = chooseNextZone(state.run, candidates);
        const selectResult = harness.appEngine.selectZone(state, nextZone.id);
        if (selectResult.ok) {
          selectedZone = nextZone;
          break;
        }
        lastSelectMessage = selectResult.message || `Could not select zone ${nextZone.id}.`;
        const candidateIndex = candidates.findIndex((zone) => zone.id === nextZone.id);
        if (candidateIndex >= 0) {
          candidates.splice(candidateIndex, 1);
        } else {
          break;
        }
      }
      if (!selectedZone) {
        throw new Error(lastSelectMessage || `Could not select any reachable zone in Act ${state.run.actNumber}.`);
      }
      if (state.phase === PHASES.ENCOUNTER) {
        const encounter = harness.content.encounterCatalog[state.run.activeEncounterId];
        encounterContext = {
          actNumber: state.run.actNumber,
          zoneTitle: selectedZone.title,
          encounterId: state.run.activeEncounterId,
          encounterName: encounter?.name || state.run.activeEncounterId,
        };
        if (state.run.activeEncounterId === encounterId) {
          break;
        }
      }
      continue;
    }

    if (state.phase === PHASES.ENCOUNTER) {
      playStateCombat(harness, state, policy, maxCombatTurns);
      const outcomeResult = harness.appEngine.syncEncounterOutcome(state);
      if (!outcomeResult.ok) {
        throw new Error(outcomeResult.message || "Could not sync encounter outcome.");
      }
      if (state.phase === PHASES.RUN_FAILED) {
        throw new Error(`Run failed before reaching ${encounterId}.`);
      }
      continue;
    }

    if (state.phase === PHASES.REWARD) {
      const reward = state.run.pendingReward;
      if (!reward) {
        throw new Error("Reward phase is active without a pending reward.");
      }
      const primaryChoice = chooseBestRewardChoice(harness, state.run, state.profile, reward, policy);
      const claimResult = harness.appEngine.claimRewardAndAdvance(state, primaryChoice?.id || "");
      if (!claimResult.ok) {
        throw new Error(claimResult.message || "Could not claim reward.");
      }
      continue;
    }

    if (state.phase === PHASES.ACT_TRANSITION) {
      if (state.run?.guide?.overlayKind === "reward") {
        const guideResult = harness.appEngine.continueActGuide(state);
        if (!guideResult.ok) {
          throw new Error(guideResult.message || "Could not dismiss act guide.");
        }
        if (state.run?.guide?.overlayKind === "reward") {
          state.run.guide.overlayKind = "";
          state.run.guide.targetActNumber = 0;
        }
      }
      const continueResult = harness.appEngine.continueActTransition(state);
      if (!continueResult.ok) {
        throw new Error(continueResult.message || "Could not continue act transition.");
      }
      optimizeSafeZoneRun(harness, state.run, state.profile, policy);
      continue;
    }

    if (state.phase === PHASES.RUN_COMPLETE) {
      throw new Error(`Run completed before reaching ${encounterId}.`);
    }

    throw new Error(`Unsupported simulation phase: ${state.phase}`);
  }

  if (!state.run || state.phase !== PHASES.ENCOUNTER || state.run.activeEncounterId !== encounterId) {
    throw new Error(`Could not reach encounter ${encounterId}.`);
  }

  const overrides = harness.runFactory.createCombatOverrides(state.run, harness.content, state.profile);
  const combatBonuses = harness.itemSystem.buildCombatBonuses(state.run, harness.content);
  const armorProfile = harness.itemSystem.buildCombatMitigationProfile(state.run, harness.content) || null;
  const weaponEquipment = getWeaponEquipment(state.run);
  const weaponItemId = weaponEquipment?.itemId || "";
  const weaponItem = harness.browserWindow.ROUGE_ITEM_CATALOG.getItemDefinition(harness.content, weaponItemId);
  const weaponProfile = harness.browserWindow.ROUGE_ITEM_CATALOG.buildEquipmentWeaponProfile(weaponEquipment, harness.content) || null;
  const weaponFamily = harness.browserWindow.ROUGE_ITEM_CATALOG.getWeaponFamily(weaponItemId, harness.content) || "";
  const classPreferredFamilies = harness.classRegistry.getPreferredWeaponFamilies(state.run.classId) || [];
  const combatState = harness.combatEngine.createCombatState({
    content: { ...harness.content, hero: overrides.heroState },
    encounterId,
    mercenaryId: state.run.mercenary.id,
    heroState: overrides.heroState,
    mercenaryState: overrides.mercenaryState,
    starterDeck: overrides.starterDeck,
    initialPotions: overrides.initialPotions,
    randomFn: state.randomFn,
    weaponFamily,
    weaponName: weaponItem?.name || "",
    weaponDamageBonus: Number(combatBonuses.heroDamageBonus || 0),
    weaponProfile,
    armorProfile,
    classPreferredFamilies,
  });
  const trace = traceCombatStateWithPolicy(harness, combatState, policy.id, maxCombatTurns);

  return {
    classId,
    policyId: policy.id,
    policyLabel: policy.label,
    seedOffset,
    encounterId,
    encounterName: encounterContext?.encounterName || encounterId,
    zoneTitle: encounterContext?.zoneTitle || "",
    outcome: trace.outcome,
    turns: trace.turns,
    finalState: trace.finalState,
    recentLog: trace.recentLog,
  };
}

export function runProgressionSimulationReport(options: RunProgressionSimulationOptions = {}): RunProgressionSimulationReport {
  const throughActNumber = clamp(options.throughActNumber || 5, 1, 5);
  const probeRuns = Math.max(0, options.probeRuns ?? 3);
  const maxCombatTurns = Math.max(12, options.maxCombatTurns || 36);
  const seedOffset = Math.max(0, options.seedOffset || 0);
  const classIds = options.classIds && options.classIds.length > 0 ? options.classIds : [...DEFAULT_CLASS_IDS];
  const policies = getPolicyDefinitions(options.policyIds);

  const classReports = classIds.map((classId) => {
    const classHarness = createQuietAppHarness();
    const classDefinition = classHarness.classRegistry.getClassDefinition(classHarness.seedBundle, classId);
    if (!classDefinition) {
      throw new Error(`Unknown class: ${classId}`);
    }

    return {
      classId,
      className: classDefinition.name,
      policyReports: policies.map((policy) => {
        const harness = createQuietAppHarness();
        return simulatePolicyRun(harness, classId, policy, throughActNumber, probeRuns, maxCombatTurns, seedOffset);
      }),
    };
  });

  return {
    generatedAt: new Date().toISOString(),
    throughActNumber,
    classReports,
  };
}
