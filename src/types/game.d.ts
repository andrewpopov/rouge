/* eslint-disable max-lines */
type RandomFn = () => number;

type CardTarget = string;
type EnemyIntentKind = string;
type EnemyIntentTarget = string;
type ZoneKind = string;
type ZoneRole = string;
type AppPhase = string;
type CombatPhase = string;
type CombatOutcome = string;

interface CardEffectBase {
  kind: string;
  value: number;
}

type CardEffect = CardEffectBase;

interface CardDefinition {
  id: string;
  title: string;
  cost: number;
  target: CardTarget;
  text: string;
  effects: CardEffect[];
}

interface HeroDefinition {
  id: string;
  name: string;
  classId?: string;
  className: string;
  maxLife: number;
  maxEnergy: number;
  handSize: number;
  potionHeal: number;
  baseStats?: Record<string, unknown>;
  startingResources?: Record<string, unknown>;
  [key: string]: unknown;
}

interface MercenaryDefinition {
  id: string;
  name: string;
  role: string;
  maxLife: number;
  attack: number;
  behavior: string;
  passiveText: string;
  routePerks?: MercenaryRoutePerkDefinition[];
  [key: string]: unknown;
}

interface MercenaryRoutePerkDefinition {
  id: string;
  title: string;
  requiredFlagIds: string[];
  attackBonus?: number;
  attackBonusPerAct?: number;
  behaviorBonus?: number;
  behaviorBonusPerAct?: number;
  startGuard?: number;
  startGuardPerAct?: number;
  heroDamageBonus?: number;
  heroDamageBonusPerAct?: number;
  heroStartGuard?: number;
  heroStartGuardPerAct?: number;
  openingDraw?: number;
  openingDrawPerAct?: number;
  scalingStartAct?: number;
}

interface EnemyIntent {
  kind: EnemyIntentKind;
  label: string;
  value: number;
  target?: EnemyIntentTarget;
  secondaryValue?: number;
}

interface EnemyTemplate {
  templateId: string;
  name: string;
  maxLife: number;
  intents: EnemyIntent[];
  role?: string;
  variant?: string;
  affixes?: string[];
}

interface EncounterEnemyEntry {
  id: string;
  templateId: string;
}

interface EncounterModifier {
  kind: string;
  value: number;
}

interface EncounterDefinition {
  id: string;
  name: string;
  description: string;
  enemies: EncounterEnemyEntry[];
  modifiers?: EncounterModifier[];
}

interface ConsequenceEncounterPackageDefinition {
  id: string;
  title: string;
  zoneRole: ZoneRole;
  requiredFlagIds: string[];
  encounterId: string;
}

interface GeneratedActEncounterIds {
  opening: string[];
  branchBattle: string[];
  branchMiniboss: string[];
  boss: string[];
}

interface RewardCardPools {
  profileCards: Record<string, string[]>;
  zoneRoleCards: Record<string, string[]>;
  bossCards: string[];
}

interface ItemBonusSet {
  heroMaxLife?: number;
  heroMaxEnergy?: number;
  heroPotionHeal?: number;
  heroDamageBonus?: number;
  heroGuardBonus?: number;
  heroBurnBonus?: number;
  mercenaryAttack?: number;
  mercenaryMaxLife?: number;
}

interface RuntimeItemDefinition {
  id: string;
  sourceId: string;
  name: string;
  slot: "weapon" | "armor";
  family: string;
  summary: string;
  actRequirement: number;
  progressionTier: number;
  maxSockets: number;
  bonuses: ItemBonusSet;
}

interface RuntimeRuneDefinition {
  id: string;
  sourceId: string;
  name: string;
  allowedSlots: Array<"weapon" | "armor">;
  rank: number;
  progressionTier: number;
  summary: string;
  bonuses: ItemBonusSet;
}

interface RuntimeRunewordDefinition {
  id: string;
  sourceId: string;
  name: string;
  slot: "weapon" | "armor";
  familyAllowList?: string[];
  progressionTier: number;
  socketCount: number;
  requiredRunes: string[];
  summary: string;
  bonuses: ItemBonusSet;
}

interface GameContent {
  hero: HeroDefinition;
  mercenaryCatalog: Record<string, MercenaryDefinition>;
  cardCatalog: Record<string, CardDefinition>;
  starterDeck: string[];
  starterDeckProfiles: Record<string, string[]>;
  classDeckProfiles: Record<string, string>;
  classProgressionCatalog?: Record<string, RuntimeClassProgressionDefinition>;
  rewardPools?: RewardCardPools;
  itemCatalog?: Record<string, RuntimeItemDefinition>;
  runeCatalog?: Record<string, RuntimeRuneDefinition>;
  runewordCatalog?: Record<string, RuntimeRunewordDefinition>;
  consequenceEncounterPackages?: Record<number, ConsequenceEncounterPackageDefinition[]>;
  enemyCatalog: Record<string, EnemyTemplate>;
  encounterCatalog: Record<string, EncounterDefinition>;
  generatedActEncounterIds?: Record<number, GeneratedActEncounterIds>;
}

interface ClassStartingResources {
  hitPoints?: string;
  mana?: string;
  [key: string]: string | undefined;
}

interface ClassDefinition {
  id: string;
  name: string;
  skillTrees: string[];
  baseStats?: Record<string, unknown>;
  startingResources?: ClassStartingResources;
  [key: string]: unknown;
}

interface SkillSeedDefinition {
  id: string;
  name: string;
  requiredLevel: number;
}

interface SkillTreeSeedDefinition {
  id: string;
  name: string;
  skills: SkillSeedDefinition[];
}

interface ClassSkillsSeedEntry {
  classId: string;
  className: string;
  trees: SkillTreeSeedDefinition[];
}

interface SkillsSeedFile {
  version?: string;
  source?: string | Record<string, unknown>;
  classes?: ClassSkillsSeedEntry[];
}

interface RuntimeClassSkillDefinition {
  id: string;
  name: string;
  requiredLevel: number;
}

interface RuntimeClassTreeDefinition {
  id: string;
  name: string;
  archetypeId: string;
  summary: string;
  bonusPerRank: ItemBonusSet;
  maxRank: number;
  unlockThreshold: number;
  unlockBonusPerThreshold: ItemBonusSet;
  skills: RuntimeClassSkillDefinition[];
}

interface RuntimeClassProgressionDefinition {
  classId: string;
  className: string;
  trees: RuntimeClassTreeDefinition[];
}

interface ActBossSeed {
  id: string;
  name: string;
  zone: string;
}

interface ActSeed {
  act: number;
  name: string;
  town: string;
  mainlineZones?: string[];
  sideZones?: string[];
  boss: ActBossSeed;
}

interface ZonesSeedFile {
  acts?: ActSeed[];
}

interface BossEntry {
  id: string;
  name: string;
  bossProfile?: string | null;
  [key: string]: unknown;
}

interface BossesSeedFile {
  entries?: BossEntry[];
}

interface EnemyPoolEntryRef {
  id: string;
  name: string;
  [key: string]: unknown;
}

interface EnemyPoolEntry {
  act: number;
  enemies?: EnemyPoolEntryRef[];
  nativeEnemies?: EnemyPoolEntryRef[];
  guestEnemiesNightmareHell?: EnemyPoolEntryRef[];
}

interface EnemyPoolsSeedFile {
  enemyPools?: EnemyPoolEntry[];
}

interface SeedBundle {
  loadedAt?: string;
  classes?: {
    classes?: ClassDefinition[];
  };
  skills?: SkillsSeedFile;
  zones?: ZonesSeedFile;
  enemyPools?: EnemyPoolsSeedFile;
  monsters?: unknown;
  items?: unknown;
  runes?: unknown;
  runewords?: unknown;
  bosses?: BossesSeedFile;
}

interface CardInstance {
  instanceId: string;
  cardId: string;
}

interface CombatHeroState extends HeroDefinition {
  life: number;
  guard: number;
  energy: number;
  alive: boolean;
  damageBonus: number;
  guardBonus: number;
  burnBonus: number;
}

interface CombatMercenaryState extends MercenaryDefinition {
  life: number;
  guard: number;
  alive: boolean;
  nextAttackBonus: number;
  markedEnemyId: string;
  markBonus: number;
  contractAttackBonus: number;
  contractBehaviorBonus: number;
  contractStartGuard: number;
  contractHeroDamageBonus: number;
  contractHeroStartGuard: number;
  contractOpeningDraw: number;
  contractPerkLabels: string[];
}

interface CombatEnemyState {
  id: string;
  templateId: string;
  name: string;
  role?: string;
  maxLife: number;
  life: number;
  guard: number;
  burn: number;
  alive: boolean;
  intentIndex: number;
  currentIntent: EnemyIntent;
  intents: EnemyIntent[];
}

interface CombatState {
  encounter: EncounterDefinition;
  randomFn: RandomFn;
  nextCardInstanceId: number;
  turn: number;
  phase: CombatPhase;
  outcome: CombatOutcome | null;
  potions: number;
  hero: CombatHeroState;
  mercenary: CombatMercenaryState;
  enemies: CombatEnemyState[];
  drawPile: CardInstance[];
  discardPile: CardInstance[];
  hand: CardInstance[];
  log: string[];
  selectedEnemyId: string;
}

interface ZoneState {
  id: string;
  actNumber: number;
  title: string;
  kind: ZoneKind;
  zoneRole: ZoneRole;
  description: string;
  encounterIds: string[];
  encounterTotal: number;
  encountersCleared: number;
  visited: boolean;
  cleared: boolean;
  status: "available" | "locked" | "cleared";
  prerequisites: string[];
  nodeId?: string;
  nodeType?: string;
}

interface ActState {
  id: string;
  actNumber: number;
  title: string;
  town: string;
  boss: ActBossSeed & {
    profile: string | null;
  };
  zones: ZoneState[];
  complete: boolean;
}

interface RewardGrants {
  gold: number;
  xp: number;
  potions: number;
}

interface RewardChoiceEffect {
  kind: string;
  slot?: "weapon" | "armor";
  value?: number;
  cardId?: string;
  fromCardId?: string;
  toCardId?: string;
  itemId?: string;
  runeId?: string;
  questId?: string;
  nodeId?: string;
  nodeType?: string;
  outcomeId?: string;
  outcomeTitle?: string;
  consequenceId?: string;
  flagIds?: string[];
}

interface RewardChoice {
  id: string;
  kind: string;
  title: string;
  subtitle: string;
  description: string;
  previewLines: string[];
  effects: RewardChoiceEffect[];
}

interface TownAction {
  id: string;
  category: string;
  title: string;
  subtitle: string;
  description: string;
  previewLines: string[];
  cost: number;
  actionLabel: string;
  disabled: boolean;
}

interface RunReward {
  zoneId: string;
  zoneTitle: string;
  kind: ZoneKind;
  title: string;
  lines: string[];
  grants: RewardGrants;
  choices: RewardChoice[];
  encounterNumber: number;
  clearsZone: boolean;
  endsAct: boolean;
  endsRun: boolean;
  heroLifeAfterFight: number;
  mercenaryLifeAfterFight: number;
}

interface WorldNodeRewardDefinition {
  id: string;
  title: string;
  description: string;
  summary: string;
  grants: RewardGrants;
  choices: WorldNodeChoiceDefinition[];
}

interface WorldNodeChoiceDefinition {
  id: string;
  title: string;
  subtitle: string;
  description: string;
  effects: RewardChoiceEffect[];
  followUp?: WorldNodeRewardDefinition;
}

interface QuestNodeDefinition extends WorldNodeRewardDefinition {
  kind: "quest";
  zoneTitle: string;
}

interface ShrineNodeDefinition extends WorldNodeRewardDefinition {
  kind: "shrine";
  zoneTitle: string;
}

interface EventNodeDefinition {
  kind: "event";
  id: string;
  title: string;
  zoneTitle: string;
  description: string;
  summary: string;
  grants: RewardGrants;
  requiresQuestId: string;
}

interface OpportunityNodeVariantDefinition extends WorldNodeRewardDefinition {
  requiresPrimaryOutcomeIds?: string[];
  requiresFollowUpOutcomeIds?: string[];
  requiresConsequenceIds?: string[];
  requiresFlagIds?: string[];
  requiresMercenaryIds?: string[];
}

interface ShrineOpportunityVariantDefinition extends WorldNodeRewardDefinition {
  requiresShrineOutcomeIds?: string[];
  requiresFlagIds?: string[];
  requiresMercenaryIds?: string[];
}

interface ReserveOpportunityVariantDefinition extends WorldNodeRewardDefinition {
  requiresFlagIds?: string[];
}

interface OpportunityNodeDefinition {
  kind: "opportunity";
  id: string;
  title: string;
  zoneTitle: string;
  description: string;
  summary: string;
  grants: RewardGrants;
  requiresQuestId: string;
  variants: OpportunityNodeVariantDefinition[];
}

interface CrossroadOpportunityDefinition extends OpportunityNodeDefinition {
  requiresShrineId: string;
}

interface ShrineOpportunityDefinition {
  kind: "opportunity";
  id: string;
  title: string;
  zoneTitle: string;
  description: string;
  summary: string;
  grants: RewardGrants;
  requiresShrineId: string;
  variants: ShrineOpportunityVariantDefinition[];
}

interface ReserveOpportunityDefinition {
  kind: "opportunity";
  id: string;
  title: string;
  zoneTitle: string;
  description: string;
  summary: string;
  grants: RewardGrants;
  requiresQuestId: string;
  requiresOpportunityId: string;
  requiresShrineOpportunityId: string;
  requiresCrossroadOpportunityId: string;
  variants: ReserveOpportunityVariantDefinition[];
}

interface RelayOpportunityDefinition {
  kind: "opportunity";
  id: string;
  title: string;
  zoneTitle: string;
  description: string;
  summary: string;
  grants: RewardGrants;
  requiresQuestId: string;
  requiresReserveOpportunityId: string;
  variants: ReserveOpportunityVariantDefinition[];
}

interface CulminationOpportunityDefinition extends OpportunityNodeDefinition {
  requiresRelayOpportunityId: string;
}

interface LegacyOpportunityDefinition {
  kind: "opportunity";
  id: string;
  title: string;
  zoneTitle: string;
  description: string;
  summary: string;
  grants: RewardGrants;
  requiresQuestId: string;
  requiresCulminationOpportunityId: string;
  variants: ReserveOpportunityVariantDefinition[];
}

interface ReckoningOpportunityDefinition {
  kind: "opportunity";
  id: string;
  title: string;
  zoneTitle: string;
  description: string;
  summary: string;
  grants: RewardGrants;
  requiresQuestId: string;
  requiresReserveOpportunityId: string;
  requiresCulminationOpportunityId: string;
  variants: ReserveOpportunityVariantDefinition[];
}

interface RecoveryOpportunityDefinition {
  kind: "opportunity";
  id: string;
  title: string;
  zoneTitle: string;
  description: string;
  summary: string;
  grants: RewardGrants;
  requiresQuestId: string;
  requiresShrineOpportunityId: string;
  requiresCulminationOpportunityId: string;
  variants: ReserveOpportunityVariantDefinition[];
}

interface AccordOpportunityDefinition {
  kind: "opportunity";
  id: string;
  title: string;
  zoneTitle: string;
  description: string;
  summary: string;
  grants: RewardGrants;
  requiresQuestId: string;
  requiresShrineOpportunityId: string;
  requiresCrossroadOpportunityId: string;
  requiresCulminationOpportunityId: string;
  variants: ReserveOpportunityVariantDefinition[];
}

interface CovenantOpportunityDefinition {
  kind: "opportunity";
  id: string;
  title: string;
  zoneTitle: string;
  description: string;
  summary: string;
  grants: RewardGrants;
  requiresQuestId: string;
  requiresLegacyOpportunityId: string;
  requiresReckoningOpportunityId: string;
  requiresRecoveryOpportunityId: string;
  requiresAccordOpportunityId: string;
  variants: ReserveOpportunityVariantDefinition[];
}

interface WorldNodeCatalog {
  quests: Record<number, QuestNodeDefinition>;
  shrines: Record<number, ShrineNodeDefinition>;
  events: Record<number, EventNodeDefinition>;
  opportunities: Record<number, OpportunityNodeDefinition>;
  crossroadOpportunities: Record<number, CrossroadOpportunityDefinition>;
  shrineOpportunities: Record<number, ShrineOpportunityDefinition>;
  reserveOpportunities: Record<number, ReserveOpportunityDefinition>;
  relayOpportunities: Record<number, RelayOpportunityDefinition>;
  culminationOpportunities: Record<number, CulminationOpportunityDefinition>;
  legacyOpportunities: Record<number, LegacyOpportunityDefinition>;
  reckoningOpportunities: Record<number, ReckoningOpportunityDefinition>;
  recoveryOpportunities: Record<number, RecoveryOpportunityDefinition>;
  accordOpportunities: Record<number, AccordOpportunityDefinition>;
  covenantOpportunities: Record<number, CovenantOpportunityDefinition>;
}

interface RunEquipmentState {
  entryId: string;
  itemId: string;
  slot: "weapon" | "armor";
  socketsUnlocked: number;
  insertedRunes: string[];
  runewordId: string;
}

interface InventoryEquipmentEntry {
  entryId: string;
  kind: "equipment";
  equipment: RunEquipmentState;
}

interface InventoryRuneEntry {
  entryId: string;
  kind: "rune";
  runeId: string;
}

type InventoryEntry = InventoryEquipmentEntry | InventoryRuneEntry;

interface RunInventoryState {
  nextEntryId: number;
  carried: InventoryEntry[];
}

interface RunVendorState {
  refreshCount: number;
  stock: InventoryEntry[];
}

interface RunTownState {
  vendor: RunVendorState;
}

interface QuestOutcomeRecord {
  questId: string;
  zoneId: string;
  actNumber: number;
  title: string;
  outcomeId: string;
  outcomeTitle: string;
  status: "primary_resolved" | "follow_up_resolved" | "chain_resolved";
  followUpNodeId?: string;
  followUpOutcomeId?: string;
  followUpOutcomeTitle?: string;
  consequenceIds: string[];
  flags: string[];
}

interface WorldNodeOutcomeRecord {
  nodeId: string;
  zoneId: string;
  actNumber: number;
  title: string;
  outcomeId: string;
  outcomeTitle: string;
  linkedQuestId?: string;
  flagIds: string[];
}

interface RunWorldState {
  resolvedNodeIds: string[];
  questOutcomes: Record<string, QuestOutcomeRecord>;
  shrineOutcomes: Record<string, WorldNodeOutcomeRecord>;
  eventOutcomes: Record<string, WorldNodeOutcomeRecord>;
  opportunityOutcomes: Record<string, WorldNodeOutcomeRecord>;
  worldFlags: string[];
}

interface RunAttributeState {
  strength: number;
  dexterity: number;
  vitality: number;
  energy: number;
}

interface RunClassProgressionState {
  favoredTreeId: string;
  treeRanks: Record<string, number>;
  unlockedSkillIds: string[];
}

interface RunProgressionState {
  bossTrophies: string[];
  activatedRunewords: string[];
  skillPointsAvailable: number;
  trainingPointsSpent: number;
  classPointsAvailable: number;
  classPointsSpent: number;
  attributePointsAvailable: number;
  attributePointsSpent: number;
  attributes: RunAttributeState;
  classProgression: RunClassProgressionState;
  training: {
    vitality: number;
    focus: number;
    command: number;
  };
}

interface RunState {
  id: string;
  currentActIndex: number;
  acts: ActState[];
  actNumber: number;
  actTitle: string;
  safeZoneName: string;
  bossName: string;
  classId: string;
  className: string;
  hero: HeroDefinition & {
    currentLife: number;
  };
  mercenary: MercenaryDefinition & {
    currentLife: number;
  };
  deck: string[];
  gold: number;
  xp: number;
  level: number;
  belt: {
    current: number;
    max: number;
  };
  inventory: RunInventoryState;
  loadout: {
    weapon: RunEquipmentState | null;
    armor: RunEquipmentState | null;
  };
  town: RunTownState;
  progression: RunProgressionState;
  activeZoneId: string;
  activeEncounterId: string;
  pendingReward: RunReward | null;
  world: RunWorldState;
  summary: {
    encountersCleared: number;
    zonesCleared: number;
    actsCleared: number;
    goldGained: number;
    xpGained: number;
    levelsGained: number;
    skillPointsEarned: number;
    classPointsEarned: number;
    attributePointsEarned: number;
    trainingRanksGained: number;
    bossesDefeated: number;
    runewordsForged: number;
  };
}

interface RunClassTreeSummary {
  treeId: string;
  treeName: string;
  archetypeId: string;
  rank: number;
  maxRank: number;
  unlockedSkills: number;
  availableSkills: number;
  isFavored: boolean;
  nextUnlock: string;
  bonusLines: string[];
}

interface RunProgressionSummary {
  skillPointsAvailable: number;
  classPointsAvailable: number;
  attributePointsAvailable: number;
  trainingRanks: number;
  favoredTreeId: string;
  favoredTreeName: string;
  unlockedClassSkills: number;
  nextClassUnlock: string;
  attributeSummaryLines: string[];
  trainingSummaryLines: string[];
  bonusSummaryLines: string[];
  treeSummaries: RunClassTreeSummary[];
}

interface RunHistoryEntry {
  runId: string;
  classId: string;
  className: string;
  level: number;
  actsCleared: number;
  bossesDefeated: number;
  goldGained: number;
  runewordsForged: number;
  skillPointsEarned: number;
  classPointsEarned: number;
  attributePointsEarned: number;
  trainingRanksGained: number;
  favoredTreeId: string;
  favoredTreeName: string;
  unlockedClassSkills: number;
  loadoutTier?: number;
  loadoutSockets?: number;
  carriedEquipmentCount?: number;
  carriedRuneCount?: number;
  stashEntryCount?: number;
  stashEquipmentCount?: number;
  stashRuneCount?: number;
  activeRunewordIds: string[];
  newFeatureIds: string[];
  completedAt: string;
  outcome: "completed" | "failed" | "abandoned";
}

interface ProfileMetaSettings {
  showHints: boolean;
  reduceMotion: boolean;
  compactMode: boolean;
}

interface ProfileSettingsPatch {
  showHints?: boolean;
  reduceMotion?: boolean;
  compactMode?: boolean;
}

interface ProfileMetaProgression {
  highestLevel: number;
  highestActCleared: number;
  totalBossesDefeated: number;
  totalGoldCollected: number;
  totalRunewordsForged: number;
  classesPlayed: string[];
  preferredClassId: string;
  lastPlayedClassId: string;
}

type ProfileUnlockCategory = "classIds" | "bossIds" | "runewordIds" | "townFeatureIds";

interface ProfileMetaUnlockState {
  classIds: string[];
  bossIds: string[];
  runewordIds: string[];
  townFeatureIds: string[];
}

interface ProfileMetaTutorialState {
  seenIds: string[];
  completedIds: string[];
  dismissedIds: string[];
}

interface ProfileMetaAccountProgressionState {
  focusedTreeId: string;
}

interface ProfileMetaState {
  settings: ProfileMetaSettings;
  progression: ProfileMetaProgression;
  unlocks: ProfileMetaUnlockState;
  tutorials: ProfileMetaTutorialState;
  accountProgression: ProfileMetaAccountProgressionState;
}

interface ProfileState {
  activeRunSnapshot: RunSnapshotEnvelope | null;
  stash: {
    entries: InventoryEntry[];
  };
  runHistory: RunHistoryEntry[];
  meta: ProfileMetaState;
}

interface ProfileEnvelope {
  schemaVersion: number;
  savedAt: string;
  profile: ProfileState;
}

interface ProfileSummary {
  hasActiveRun: boolean;
  stashEntries: number;
  runHistoryCount: number;
  completedRuns: number;
  failedRuns: number;
  highestLevel: number;
  highestActCleared: number;
  totalBossesDefeated: number;
  totalGoldCollected: number;
  totalRunewordsForged: number;
  classesPlayedCount: number;
  preferredClassId: string;
  lastPlayedClassId: string;
  unlockedClassCount: number;
  unlockedBossCount: number;
  unlockedRunewordCount: number;
  townFeatureCount: number;
  seenTutorialCount: number;
  completedTutorialCount: number;
  dismissedTutorialCount: number;
}

interface ProfileAccountMilestoneSummary {
  id: string;
  title: string;
  description: string;
  rewardFeatureId: string;
  treeId: string;
  treeTitle: string;
  tier: number;
  tierLabel: string;
  isCapstone: boolean;
  isEligible: boolean;
  status: "locked" | "available" | "unlocked";
  blockedByIds: string[];
  blockedByTitles: string[];
  unlocked: boolean;
  progress: number;
  target: number;
}

interface ProfileAccountTreeSummary {
  id: string;
  title: string;
  description: string;
  isFocused: boolean;
  currentRank: number;
  maxRank: number;
  eligibleMilestoneCount: number;
  blockedMilestoneCount: number;
  nextMilestoneId: string;
  nextMilestoneTitle: string;
  capstoneId: string;
  capstoneTitle: string;
  capstoneUnlocked: boolean;
  capstoneStatus: "locked" | "available" | "unlocked";
  unlockedFeatureIds: string[];
  milestones: ProfileAccountMilestoneSummary[];
}

interface ProfileStashSummary {
  entryCount: number;
  equipmentCount: number;
  runeCount: number;
  socketReadyEquipmentCount: number;
  socketedRuneCount: number;
  runewordEquipmentCount: number;
  itemIds: string[];
  runeIds: string[];
}

interface ProfileArchiveSummary {
  entryCount: number;
  completedCount: number;
  failedCount: number;
  abandonedCount: number;
  latestClassId: string;
  latestClassName: string;
  latestOutcome: "" | "completed" | "failed" | "abandoned";
  latestCompletedAt: string;
  highestLevel: number;
  highestActsCleared: number;
  highestGoldGained: number;
  highestLoadoutTier: number;
  runewordArchiveCount: number;
  featureUnlockCount: number;
  favoredTreeId: string;
  favoredTreeName: string;
  planningArchiveCount: number;
  recentFeatureIds: string[];
}

interface ProfileAccountReviewSummary {
  capstoneCount: number;
  unlockedCapstoneCount: number;
  blockedCapstoneCount: number;
  readyCapstoneCount: number;
  nextCapstoneId: string;
  nextCapstoneTitle: string;
}

interface ProfileAccountSummary {
  profile: ProfileSummary;
  settings: ProfileMetaSettings;
  unlockedFeatureIds: string[];
  activeTutorialIds: string[];
  dismissedTutorialCount: number;
  stash: ProfileStashSummary;
  archive: ProfileArchiveSummary;
  review: ProfileAccountReviewSummary;
  focusedTreeId: string;
  focusedTreeTitle: string;
  treeCount: number;
  trees: ProfileAccountTreeSummary[];
  runHistoryCapacity: number;
  nextMilestoneId: string;
  nextMilestoneTitle: string;
  unlockedMilestoneCount: number;
  milestoneCount: number;
  milestones: ProfileAccountMilestoneSummary[];
}

interface CombatOverrides {
  heroState: HeroDefinition & {
    life: number;
    damageBonus: number;
    guardBonus: number;
    burnBonus: number;
  };
  mercenaryState: MercenaryDefinition & CombatMercenaryRouteBonusState & { life: number };
  starterDeck: string[];
  initialPotions: number;
}

interface AppState {
  phase: AppPhase;
  content: GameContent;
  seedBundle: SeedBundle;
  combatEngine: CombatEngineApi;
  randomFn: RandomFn;
  registries: {
    classes: ClassDefinition[];
    mercenaries: MercenaryDefinition[];
  };
  ui: {
    selectedClassId: string;
    selectedMercenaryId: string;
    reviewedHistoryIndex: number;
    confirmAbandonSavedRun: boolean;
  };
  profile: ProfileState;
  run: RunState | null;
  combat: CombatState | null;
  error: string;
}

interface BootState {
  status: "loading" | "ready" | "error";
  error: string;
}

interface ActionResult {
  ok: boolean;
  message?: string;
}

interface ZoneBeginResult extends ActionResult {
  type?: string;
  zone?: ZoneState;
  encounterId?: string;
  encounterIndex?: number;
  encounterTotal?: number;
  reward?: RunReward;
}

interface CombatEngineApi {
  createCombatState(config: {
    content: GameContent;
    encounterId: string;
    mercenaryId: string;
    randomFn?: RandomFn;
    heroState?: Partial<HeroDefinition> | null;
    mercenaryState?: Partial<MercenaryDefinition & CombatMercenaryRouteBonusState> | null;
    starterDeck?: string[] | null;
    initialPotions?: number;
  }): CombatState;
  playCard(state: CombatState, content: GameContent, instanceId: string, targetId?: string): ActionResult;
  endTurn(state: CombatState): ActionResult;
  usePotion(state: CombatState, targetId: "hero" | "mercenary"): ActionResult;
  describeIntent(intent: EnemyIntent | null): string;
  getLivingEnemies(state: CombatState): CombatEnemyState[];
  getFirstLivingEnemyId(state: CombatState): string;
}

interface CombatMercenaryRouteBonusState {
  contractAttackBonus?: number;
  contractBehaviorBonus?: number;
  contractStartGuard?: number;
  contractHeroDamageBonus?: number;
  contractHeroStartGuard?: number;
  contractOpeningDraw?: number;
  contractPerkLabels?: string[];
}

interface SeedLoaderApi {
  SEED_ROOT: string;
  SEED_FILES: Record<string, string>;
  loadSeedBundle(): Promise<SeedBundle>;
}

interface EncounterRegistryGroupedEntries {
  raider: EnemyPoolEntryRef[];
  ranged: EnemyPoolEntryRef[];
  support: EnemyPoolEntryRef[];
  brute: EnemyPoolEntryRef[];
}

interface EncounterRegistryEnemyScale {
  life: number;
  attack: number;
  guard: number;
  heal: number;
}

interface EncounterRegistryEliteAffixProfile {
  id: string;
  label: string;
  lifeBonus: number;
  attackBonus: number;
  guardBonus: number;
}

interface EncounterRegistryElitePackage {
  profileId: string;
  role: string;
  entryIndex: number;
  templateIdSuffix: string;
}

interface EncounterRegistryActContent {
  enemyCatalog: Record<string, EnemyTemplate>;
  encounterCatalog: Record<string, EncounterDefinition>;
  encounterIdsByKind: GeneratedActEncounterIds;
}

interface EncounterRegistryEnemyBuildersApi {
  normalizeActPool(seedBundle: SeedBundle, actNumber: number): EnemyPoolEntryRef[];
  groupByRole(entries: EnemyPoolEntryRef[]): EncounterRegistryGroupedEntries;
  getElitePackages(actNumber: number): EncounterRegistryElitePackage[];
  getEliteAffixProfile(profileId: string): EncounterRegistryEliteAffixProfile;
  buildEnemyTemplate(options: {
    actNumber: number;
    entry: EnemyPoolEntryRef;
    role: string;
    variant?: string;
    templateIdSuffix?: string;
    labelPrefix?: string;
    scaleOverride?: EncounterRegistryEnemyScale | null;
    affixes?: string[];
    intents?: EnemyIntent[] | null;
  }): EnemyTemplate;
  buildEliteTemplate(options: {
    actNumber: number;
    entry: EnemyPoolEntryRef;
    role: string;
    profile: EncounterRegistryEliteAffixProfile;
    templateIdSuffix: string;
  }): EnemyTemplate;
  buildBossTemplate(options: {
    actNumber: number;
    actSeed: ActSeed;
    bossEntry: BossEntry | null | undefined;
  }): EnemyTemplate;
}

interface EncounterRegistryBuildersApi {
  normalizeActPool(seedBundle: SeedBundle, actNumber: number): EnemyPoolEntryRef[];
  groupByRole(entries: EnemyPoolEntryRef[]): EncounterRegistryGroupedEntries;
  buildActEncounterSet(options: {
    actSeed: ActSeed;
    bossEntry: BossEntry | null | undefined;
    groupedEntries: EncounterRegistryGroupedEntries;
  }): EncounterRegistryActContent;
}

interface EncounterRegistryApi {
  createRuntimeContent(baseContent: GameContent, seedBundle: SeedBundle): GameContent;
}

interface ContentValidationReport {
  ok: boolean;
  errors: string[];
}

interface ContentValidatorApi {
  validateSeedBundle(seedBundle: SeedBundle): ContentValidationReport;
  assertValidSeedBundle(seedBundle: SeedBundle): void;
  validateRuntimeContent(content: GameContent): ContentValidationReport;
  assertValidRuntimeContent(content: GameContent): void;
  validateWorldNodeCatalog(worldNodeCatalog: WorldNodeCatalog): ContentValidationReport;
  assertValidWorldNodeCatalog(worldNodeCatalog: WorldNodeCatalog): void;
}

interface ContentValidatorActReferenceState {
  primaryOutcomeIds: Set<string>;
  followUpOutcomeIds: Set<string>;
  consequenceIds: Set<string>;
  shrineOutcomeIds: Set<string>;
  flagIds: Set<string>;
}

interface ContentValidatorActPathState {
  label: string;
  primaryOutcomeId: string;
  followUpOutcomeId: string;
  consequenceIds: string[];
  flagIds: string[];
  mercenaryId: string;
}

interface ContentValidatorShrinePathState {
  label: string;
  shrineOutcomeId: string;
  flagIds: string[];
  mercenaryId: string;
}

interface ContentValidatorFlagPathState {
  label: string;
  flagIds: string[];
}

interface ContentValidatorVariantChoiceSource {
  variants?: Array<{
    choices?: WorldNodeChoiceDefinition[];
  }>;
}

interface ContentValidatorWorldPathsApi {
  collectEffectFlagIds(effects: RewardChoiceEffect[] | null | undefined): Set<string>;
  collectActReferenceState(
    questDefinition: QuestNodeDefinition | null | undefined,
    shrineDefinition: ShrineNodeDefinition | null | undefined
  ): ContentValidatorActReferenceState;
  collectActPathStates(
    questDefinition: QuestNodeDefinition | null | undefined,
    shrineDefinition: ShrineNodeDefinition | null | undefined,
    options?: { includeEmptyShrineState?: boolean }
  ): ContentValidatorActPathState[];
  collectShrinePathStates(shrineDefinition: ShrineNodeDefinition | null | undefined): ContentValidatorShrinePathState[];
  collectOpportunityChoiceStates(opportunityDefinition: ContentValidatorVariantChoiceSource | null | undefined): ContentValidatorFlagPathState[];
  collectReservePathStates(
    opportunityDefinition: ContentValidatorVariantChoiceSource | null | undefined,
    shrineOpportunityDefinition: ContentValidatorVariantChoiceSource | null | undefined,
    crossroadOpportunityDefinition: ContentValidatorVariantChoiceSource | null | undefined
  ): ContentValidatorFlagPathState[];
  collectRelayPathStates(reserveOpportunityDefinition: ContentValidatorVariantChoiceSource | null | undefined): ContentValidatorFlagPathState[];
  collectCulminationPathStates(
    questDefinition: QuestNodeDefinition | null | undefined,
    shrineDefinition: ShrineNodeDefinition | null | undefined,
    relayOpportunityDefinition: ContentValidatorVariantChoiceSource | null | undefined
  ): ContentValidatorActPathState[];
  collectLegacyPathStates(culminationOpportunityDefinition: ContentValidatorVariantChoiceSource | null | undefined): ContentValidatorFlagPathState[];
  collectReckoningPathStates(
    culminationOpportunityDefinition: ContentValidatorVariantChoiceSource | null | undefined,
    reserveOpportunityDefinition: ContentValidatorVariantChoiceSource | null | undefined
  ): ContentValidatorFlagPathState[];
  collectRecoveryPathStates(
    culminationOpportunityDefinition: ContentValidatorVariantChoiceSource | null | undefined,
    shrineOpportunityDefinition: ContentValidatorVariantChoiceSource | null | undefined
  ): ContentValidatorFlagPathState[];
  collectAccordPathStates(
    culminationOpportunityDefinition: ContentValidatorVariantChoiceSource | null | undefined,
    shrineOpportunityDefinition: ContentValidatorVariantChoiceSource | null | undefined,
    crossroadOpportunityDefinition: ContentValidatorVariantChoiceSource | null | undefined
  ): ContentValidatorFlagPathState[];
  collectCovenantPathStates(
    legacyOpportunityDefinition: ContentValidatorVariantChoiceSource | null | undefined,
    reckoningOpportunityDefinition: ContentValidatorVariantChoiceSource | null | undefined,
    recoveryOpportunityDefinition: ContentValidatorVariantChoiceSource | null | undefined,
    accordOpportunityDefinition: ContentValidatorVariantChoiceSource | null | undefined
  ): ContentValidatorFlagPathState[];
  getOpportunityVariantRequirementSignature(variantDefinition: OpportunityNodeVariantDefinition | null | undefined): string;
  getShrineOpportunityVariantRequirementSignature(variantDefinition: ShrineOpportunityVariantDefinition | null | undefined): string;
  getReserveOpportunityVariantRequirementSignature(variantDefinition: ReserveOpportunityVariantDefinition | null | undefined): string;
  getOpportunityVariantSpecificity(variantDefinition: OpportunityNodeVariantDefinition | null | undefined): number;
  getShrineOpportunityVariantSpecificity(variantDefinition: ShrineOpportunityVariantDefinition | null | undefined): number;
  getReserveOpportunityVariantSpecificity(variantDefinition: ReserveOpportunityVariantDefinition | null | undefined): number;
  doesVariantMatchPath(
    variantDefinition: OpportunityNodeVariantDefinition | null | undefined,
    pathState: ContentValidatorActPathState
  ): boolean;
  doesShrineOpportunityVariantMatchPath(
    variantDefinition: ShrineOpportunityVariantDefinition | null | undefined,
    pathState: ContentValidatorShrinePathState
  ): boolean;
  doesReserveOpportunityVariantMatchPath(
    variantDefinition: ReserveOpportunityVariantDefinition | null | undefined,
    pathState: ContentValidatorFlagPathState
  ): boolean;
}

interface ClassRegistryApi {
  createRuntimeContent(baseContent: GameContent, seedBundle: SeedBundle): GameContent;
  listPlayableClasses(seedBundle: SeedBundle): ClassDefinition[];
  getClassDefinition(seedBundle: SeedBundle, classId: string): ClassDefinition | null;
  getDeckProfileId(content: GameContent, classId: string): string;
  getStarterDeckForClass(content: GameContent, classId: string): string[];
  createHeroFromClass(content: GameContent, classDefinition: ClassDefinition): HeroDefinition;
  getClassProgression(content: GameContent, classId: string): RuntimeClassProgressionDefinition | null;
}

interface ItemTemplateDefinition {
  sourceId: string;
  slot: string;
  actRequirement: number;
  progressionTier: number;
  bonuses: ItemBonusSet;
}

interface RuneTemplateDefinition {
  sourceId: string;
  allowedSlots: string[];
  progressionTier: number;
  bonuses: ItemBonusSet;
}

interface RunewordTemplateDefinition {
  sourceId: string;
  slot: string;
  familyAllowList?: string[];
  requiredRunes: string[];
  bonuses: ItemBonusSet;
}

interface ItemDataApi {
  ITEM_TEMPLATES: Record<string, ItemTemplateDefinition>;
  RUNE_TEMPLATES: Record<string, RuneTemplateDefinition>;
  RUNEWORD_TEMPLATES: Record<string, RunewordTemplateDefinition>;
  RUNE_REWARD_POOLS: Record<string, string[]>;
}

interface HydratedLoadout {
  weapon: RunEquipmentState | null;
  armor: RunEquipmentState | null;
}

interface ItemCatalogApi {
  clamp(value: number, min: number, max: number): number;
  uniquePush(list: string[], value: string): void;
  toNumber(value: unknown, fallback?: number): number;
  createRuntimeContent(baseContent: GameContent, seedBundle: SeedBundle): GameContent;
  getItemDefinition(content: GameContent, itemId: string): RuntimeItemDefinition | null;
  getRuneDefinition(content: GameContent, runeId: string): RuntimeRuneDefinition | null;
  getRunewordDefinition(content: GameContent, runewordId: string): RuntimeRunewordDefinition | null;
  isRuneAllowedInSlot(rune: RuntimeRuneDefinition | null | undefined, slot: "weapon" | "armor"): boolean;
  resolveRunewordId(equipment: RunEquipmentState | null | undefined, content: GameContent): string;
  normalizeEquipmentState(
    value: unknown,
    slot: "weapon" | "armor",
    content: GameContent,
    legacyRuneId?: string
  ): RunEquipmentState | null;
  buildHydratedLoadout(run: RunState, content: GameContent): HydratedLoadout;
  getPreferredRunewordForEquipment(
    equipment: RunEquipmentState | null | undefined,
    run: RunState,
    content: GameContent
  ): RuntimeRunewordDefinition | null;
  getRuneRewardPool(slot: "weapon" | "armor"): string[];
}

interface ItemLoadoutApi {
  createDefaultInventory(): RunInventoryState;
  createDefaultTownState(): RunTownState;
  hydrateRunLoadout(run: RunState, content: GameContent): void;
  hydrateProfileStash(profile: ProfileState, content: GameContent): void;
  syncRunewordTracking(run: RunState, content: GameContent): void;
  cloneEquipmentState(equipment: RunEquipmentState | null | undefined): RunEquipmentState | null;
  cloneInventoryEntry(entry: InventoryEntry | null | undefined): InventoryEntry | null;
  ensureEquipmentEntryId(run: RunState, equipment: RunEquipmentState | null | undefined): string;
  normalizeInventoryEntry(entry: unknown, run: RunState, content: GameContent, fallbackId?: string): InventoryEntry | null;
  getEntryLabel(entry: InventoryEntry, content: GameContent): string;
  addEquipmentToInventory(run: RunState, itemId: string, content: GameContent): InventoryEquipmentEntry | null;
  addRuneToInventory(run: RunState, runeId: string, content: GameContent): InventoryRuneEntry | null;
  findCarriedEntry(run: RunState, entryId: string): InventoryEntry | null;
  removeCarriedEntry(run: RunState, entryId: string): InventoryEntry | null;
  removeStashEntry(profile: ProfileState, entryId: string): InventoryEntry | null;
  equipInventoryEntry(run: RunState, entryId: string, content: GameContent): ActionResult;
  unequipSlot(run: RunState, slot: "weapon" | "armor", content: GameContent): ActionResult;
  socketInventoryRune(run: RunState, entryId: string, slot: "weapon" | "armor", content: GameContent): ActionResult;
  stashCarriedEntry(run: RunState, profile: ProfileState, entryId: string): ActionResult;
  withdrawStashEntry(run: RunState, profile: ProfileState, entryId: string): ActionResult;
  getActiveRunewords(run: RunState, content: GameContent): string[];
  getLoadoutSummary(run: RunState, content: GameContent): string[];
  applyChoice(run: RunState, choice: RewardChoice, content: GameContent): ActionResult;
  buildCombatBonuses(run: RunState, content: GameContent): ItemBonusSet;
}

interface AccountEconomyFeatures {
  advancedVendorStock: boolean;
  runewordCodex: boolean;
  economyLedger: boolean;
  salvageTithes: boolean;
  artisanStock: boolean;
  brokerageCharter: boolean;
  treasuryExchange: boolean;
  economyFocus: boolean;
}

interface ItemTownApi {
  getAccountEconomyFeatures(profile?: ProfileState | null): AccountEconomyFeatures;
  getEntryBuyPrice(entry: InventoryEntry, content: GameContent, profile?: ProfileState | null): number;
  getEntrySellPrice(entry: InventoryEntry, content: GameContent, profile?: ProfileState | null): number;
  getVendorRefreshCost(run: RunState, profile?: ProfileState | null): number;
  normalizeVendorStock(run: RunState, content: GameContent, profile?: ProfileState | null): void;
  hydrateRunInventory(run: RunState, content: GameContent, profile?: ProfileState | null): void;
  listTownActions(run: RunState, profile: ProfileState, content: GameContent): TownAction[];
  applyTownAction(run: RunState, profile: ProfileState, content: GameContent, actionId: string): ActionResult;
  getInventorySummary(run: RunState, profile: ProfileState, content: GameContent): string[];
}

interface ItemSystemApi {
  createRuntimeContent(baseContent: GameContent, seedBundle: SeedBundle): GameContent;
  hydrateRunLoadout(run: RunState, content: GameContent): void;
  hydrateRunInventory(run: RunState, content: GameContent, profile?: ProfileState | null): void;
  hydrateProfileStash(profile: ProfileState, content: GameContent): void;
  buildEquipmentChoice(config: {
    content: GameContent;
    run: RunState;
    zone: ZoneState;
    actNumber: number;
    encounterNumber: number;
    profile?: ProfileState | null;
  }): RewardChoice | null;
  applyChoice(run: RunState, choice: RewardChoice, content: GameContent): ActionResult;
  listTownActions(run: RunState, profile: ProfileState, content: GameContent): TownAction[];
  applyTownAction(run: RunState, profile: ProfileState, content: GameContent, actionId: string): ActionResult;
  buildCombatBonuses(run: RunState, content: GameContent): ItemBonusSet;
  getActiveRunewords(run: RunState, content: GameContent): string[];
  getLoadoutSummary(run: RunState, content: GameContent): string[];
  getInventorySummary(run: RunState, profile: ProfileState, content: GameContent): string[];
}

interface RewardEngineApi {
  buildRewardChoices(config: {
    content: GameContent;
    run: RunState;
    zone: ZoneState;
    actNumber: number;
    encounterNumber: number;
    profile?: ProfileState | null;
  }): RewardChoice[];
  applyChoice(run: RunState, choice: RewardChoice, content: GameContent): ActionResult;
}

interface WorldNodeEngineApi {
  getCatalog(): WorldNodeCatalog;
  assertValidCatalog(): void;
  createQuestZone(config: { actSeed: ActSeed; prerequisites: string[] }): ZoneState;
  createShrineZone(config: { actSeed: ActSeed; prerequisites: string[] }): ZoneState;
  createEventZone(config: { actSeed: ActSeed; prerequisites: string[] }): ZoneState;
  createOpportunityZone(config: { actSeed: ActSeed; prerequisites: string[] }): ZoneState;
  createCrossroadOpportunityZone(config: { actSeed: ActSeed; prerequisites: string[] }): ZoneState;
  createShrineOpportunityZone(config: { actSeed: ActSeed; prerequisites: string[] }): ZoneState;
  createReserveOpportunityZone(config: { actSeed: ActSeed; prerequisites: string[] }): ZoneState;
  createRelayOpportunityZone(config: { actSeed: ActSeed; prerequisites: string[] }): ZoneState;
  createCulminationOpportunityZone(config: { actSeed: ActSeed; prerequisites: string[] }): ZoneState;
  createLegacyOpportunityZone(config: { actSeed: ActSeed; prerequisites: string[] }): ZoneState;
  createReckoningOpportunityZone(config: { actSeed: ActSeed; prerequisites: string[] }): ZoneState;
  createRecoveryOpportunityZone(config: { actSeed: ActSeed; prerequisites: string[] }): ZoneState;
  createAccordOpportunityZone(config: { actSeed: ActSeed; prerequisites: string[] }): ZoneState;
  createCovenantOpportunityZone(config: { actSeed: ActSeed; prerequisites: string[] }): ZoneState;
  createActWorldNodes(config: { actSeed: ActSeed; openingZoneId: string }): ZoneState[];
  isWorldNodeZone(zone: ZoneState): boolean;
  buildZoneReward(config: { run: RunState; zone: ZoneState }): RunReward;
  applyChoice(run: RunState, reward: RunReward, choice: RewardChoice): ActionResult;
}

interface TownServiceApi {
  listActions(content: GameContent, run: RunState, profile: ProfileState): TownAction[];
  applyAction(run: RunState, profile: ProfileState, content: GameContent, actionId: string): ActionResult;
}

interface RunSnapshotEnvelope {
  schemaVersion: number;
  savedAt: string;
  phase: AppPhase;
  selectedClassId: string;
  selectedMercenaryId: string;
  run: RunState;
}

interface StorageLike {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
  removeItem(key: string): void;
}

interface SaveMigrationApi {
  CURRENT_SCHEMA_VERSION: number;
  migrateSnapshot(snapshot: unknown): RunSnapshotEnvelope | null;
}

interface ProfileMigrationApi {
  CURRENT_PROFILE_SCHEMA_VERSION: number;
  migrateProfile(profile: unknown): ProfileEnvelope | null;
}

interface PersistenceApi {
  SCHEMA_VERSION: number;
  STORAGE_KEY: string;
  PROFILE_STORAGE_KEY: string;
  createSnapshot(config: {
    phase: AppPhase;
    selectedClassId: string;
    selectedMercenaryId: string;
    run: RunState;
  }): RunSnapshotEnvelope;
  createEmptyProfile(): ProfileState;
  serializeSnapshot(snapshot: RunSnapshotEnvelope): string;
  restoreSnapshot(snapshotOrSerialized: unknown): RunSnapshotEnvelope | null;
  serializeProfile(profile: ProfileEnvelope | ProfileState): string;
  restoreProfile(profileOrSerialized: unknown): ProfileEnvelope | null;
  saveProfileToStorage(profile: ProfileEnvelope | ProfileState | string, storage?: StorageLike | null): ActionResult;
  loadProfileFromStorage(storage?: StorageLike | null): ProfileState | null;
  ensureProfileMeta(profile: ProfileState): void;
  unlockProfileEntries(profile: ProfileState, category: ProfileUnlockCategory, ids: string[]): void;
  updateProfileSettings(profile: ProfileState, patch: ProfileSettingsPatch): void;
  setPreferredClass(profile: ProfileState, classId: string): void;
  setAccountProgressionFocus(profile: ProfileState, treeId: string): void;
  markTutorialSeen(profile: ProfileState, tutorialId: string): void;
  markTutorialCompleted(profile: ProfileState, tutorialId: string): void;
  dismissTutorial(profile: ProfileState, tutorialId: string): void;
  restoreTutorial(profile: ProfileState, tutorialId: string): void;
  syncProfileMetaFromRun(profile: ProfileState, run: RunState): void;
  getProfileSummary(profile: ProfileState | null): ProfileSummary;
  getAccountProgressSummary(profile: ProfileState | null): ProfileAccountSummary;
  getRunHistoryCapacity(profile: ProfileState | null): number;
  recordRunHistory(profile: ProfileState, run: RunState, outcome: RunHistoryEntry["outcome"], content?: GameContent | null): void;
  saveToStorage(snapshot: RunSnapshotEnvelope | string, storage?: StorageLike | null): ActionResult;
  loadFromStorage(storage?: StorageLike | null): RunSnapshotEnvelope | null;
  hasSavedSnapshot(storage?: StorageLike | null): boolean;
  clearStorage(storage?: StorageLike | null): void;
}

interface SavedRunSummary {
  savedAt: string;
  phase: AppPhase;
  phaseLabel: string;
  className: string;
  actTitle: string;
  safeZoneName: string;
  bossName: string;
  level: number;
  gold: number;
  deckSize: number;
  beltState: string;
  skillPointsAvailable: number;
  classPointsAvailable: number;
  attributePointsAvailable: number;
  trainingRanks: number;
  favoredTreeId: string;
  unlockedClassSkills: number;
  bossTrophies: number;
  activeRunewords: number;
  resolvedQuestOutcomes: number;
  encountersCleared: number;
  zonesCleared: number;
}

interface RenderUtilsApi {
  escapeHtml(value: unknown): string;
  buildStat(label: string, value: unknown): string;
  buildStringList(lines: string[], className?: string): string;
  buildBadge(label: string, tone?: string): string;
  buildNoticePanel(message: string, label?: string): string;
  buildChoiceList(choices: RewardChoice[], actionName?: string): string;
  buildWorldMapNodeCard(config: {
    zone: ZoneState;
    reachable: boolean;
    actionLabel: string;
    prerequisiteLabel: string;
    hookLabel: string;
    summaryLine?: string;
    detailLines?: string[];
  }): string;
  buildShell(
    root: HTMLElement,
    config: { eyebrow: string; title: string; copy: string; body: string; footer?: string }
  ): void;
  buildTownActionCard(action: TownAction): string;
  buildMercenaryActionCard(action: TownAction): string;
}

interface RunFactoryApi {
  createRun(config: {
    content: GameContent;
    seedBundle: SeedBundle;
    classDefinition: ClassDefinition;
    heroDefinition: HeroDefinition;
    mercenaryId: string;
    starterDeck: string[];
  }): RunState;
  hydrateRun(run: RunState, content: GameContent): RunState;
  createCombatOverrides(run: RunState, content: GameContent): CombatOverrides;
  beginZone(run: RunState, zoneId: string, content?: GameContent | null): ZoneBeginResult;
  getCurrentAct(run: RunState): ActState | null;
  getCurrentZones(run: RunState): ZoneState[];
  getZoneById(run: RunState, zoneId: string): ZoneState | null;
  getReachableZones(run: RunState): ZoneState[];
  recomputeZoneStatuses(run: RunState): void;
  snapshotPartyFromCombat(run: RunState, combatState: CombatState, content: GameContent): void;
  buildEncounterReward(config: { run: RunState; zone: ZoneState; combatState: CombatState; content: GameContent; profile?: ProfileState | null }): RunReward;
  applyReward(run: RunState, reward: RunReward, choiceId: string, content: GameContent): ActionResult;
  buildCombatBonuses(run: RunState, content: GameContent): ItemBonusSet;
  getProgressionSummary(run: RunState, content: GameContent): RunProgressionSummary;
  listProgressionActions(run: RunState, content: GameContent): TownAction[];
  applyProgressionAction(run: RunState, actionId: string, content: GameContent): ActionResult;
  actIsComplete(run: RunState): boolean;
  runIsComplete(run: RunState): boolean;
  advanceToNextAct(run: RunState, content: GameContent): boolean;
}

interface RunStateHelpersApi {
  deepClone<T>(value: T): T;
  clamp(value: number, min: number, max: number): number;
  toBonusValue(value: unknown, fallback?: number): number;
  slugify(value: unknown): string;
  uniquePush(list: string[], value: string): void;
  createDefaultProgression(): RunProgressionState;
  createDefaultTraining(): RunProgressionState["training"];
  createDefaultAttributes(): RunAttributeState;
  createDefaultClassProgression(): RunClassProgressionState;
  createDefaultWorldState(): RunWorldState;
  createDefaultInventory(): RunInventoryState;
  createDefaultTownState(): RunTownState;
  createDefaultSummary(): RunState["summary"];
  getLevelForXp(xp: unknown): number;
  getTrainingTrackForLevel(level: unknown): keyof RunProgressionState["training"];
  getTrainingRankCount(training: RunProgressionState["training"] | null | undefined): number;
  addBonusSet(total: ItemBonusSet, bonuses: ItemBonusSet | undefined, multiplier?: number): ItemBonusSet;
  describeBonusSet(bonuses: ItemBonusSet | null | undefined): string[];
}

interface RunRouteBuilderApi {
  createActState(actSeed: ActSeed, bossEntry: BossEntry | null | undefined, content: GameContent): ActState;
  normalizeRunActs(run: RunState): void;
  getCurrentAct(run: RunState): ActState | null;
  syncCurrentActFields(run: RunState): void;
  getCurrentZones(run: RunState): ZoneState[];
  getZoneById(run: RunState, zoneId: string): ZoneState | null;
  recomputeZoneStatuses(run: RunState): void;
  getReachableZones(run: RunState): ZoneState[];
}

interface RunProgressionApi {
  buildProgressionBonuses(run: RunState, content: GameContent): ItemBonusSet;
  getProgressionSummary(run: RunState, content: GameContent): RunProgressionSummary;
  syncLevelProgression(run: RunState): void;
  syncUnlockedClassSkills(run: RunState, content: GameContent): void;
  listProgressionActions(run: RunState, content: GameContent): TownAction[];
  applyProgressionAction(run: RunState, actionId: string, content: GameContent): ActionResult;
}

interface RunRewardFlowApi {
  buildEncounterReward(config: { run: RunState; zone: ZoneState; combatState: CombatState; content: GameContent; profile?: ProfileState | null }): RunReward;
  applyReward(run: RunState, reward: RunReward, choiceId: string, content: GameContent): ActionResult;
  actIsComplete(run: RunState): boolean;
  runIsComplete(run: RunState): boolean;
  advanceToNextAct(run: RunState, content: GameContent): boolean;
}

interface AppEngineApi {
  PHASES: Record<string, AppPhase>;
  createAppState(config: {
    content: GameContent;
    seedBundle: SeedBundle;
    combatEngine: CombatEngineApi;
    randomFn?: RandomFn;
  }): AppState;
  setSelectedClass(state: AppState, classId: string): void;
  setSelectedMercenary(state: AppState, mercenaryId: string): void;
  startCharacterSelect(state: AppState): void;
  startRun(state: AppState): ActionResult;
  continueSavedRun(state: AppState): ActionResult;
  getProfileSummary(state?: AppState | null): ProfileSummary;
  getAccountProgressSummary(state?: AppState | null): ProfileAccountSummary;
  updateProfileSettings(state: AppState, patch: ProfileSettingsPatch): ActionResult;
  setPreferredClass(state: AppState, classId: string): ActionResult;
  setRunHistoryReviewIndex(state: AppState, historyIndex: number): void;
  setAccountProgressionFocus(state: AppState, treeId: string): ActionResult;
  markTutorialSeen(state: AppState, tutorialId: string): ActionResult;
  completeTutorial(state: AppState, tutorialId: string): ActionResult;
  dismissTutorial(state: AppState, tutorialId: string): ActionResult;
  restoreTutorial(state: AppState, tutorialId: string): ActionResult;
  hasSavedRun(): boolean;
  getSavedRunSummary(): SavedRunSummary | null;
  saveRunSnapshot(state: AppState): string | null;
  loadRunSnapshot(state: AppState, serializedSnapshot: string): ActionResult;
  clearSavedRun(): void;
  abandonSavedRun(state: AppState): ActionResult;
  leaveSafeZone(state: AppState): ActionResult;
  returnToSafeZone(state: AppState): ActionResult;
  useTownAction(state: AppState, actionId: string): ActionResult;
  selectZone(state: AppState, zoneId: string): ActionResult;
  syncEncounterOutcome(state: AppState): ActionResult;
  claimRewardAndAdvance(state: AppState, choiceId?: string): ActionResult;
  continueActTransition(state: AppState): ActionResult;
  returnToFrontDoor(state: AppState): void;
}

interface AppShellRenderConfig {
  appState: AppState | null;
  baseContent: GameContent;
  bootState: BootState;
}

interface AppShellApi {
  render(root: HTMLElement, config: AppShellRenderConfig): void;
}

interface ActionDispatcherConfig {
  target: EventTarget | null;
  appState: AppState | null;
  appEngine: AppEngineApi;
  combatEngine: CombatEngineApi;
  render: () => void;
  syncCombatResultAndRender: () => void;
}

interface ActionDispatcherApi {
  handleClick(config: ActionDispatcherConfig): boolean;
}

interface DerivedPartyState {
  hero: {
    currentLife: number;
    maxLife: number;
    maxEnergy: number;
    potionHeal: number;
  };
  mercenary: {
    currentLife: number;
    maxLife: number;
    attack: number;
  };
  loadoutLines: string[];
  activeRunewords: string[];
  bonuses: ItemBonusSet;
}

interface SafeZoneSnapshot {
  currentAct: ActState | null;
  currentZones: ZoneState[];
  reachableZones: ZoneState[];
  clearedZones: number;
  encountersCleared: number;
  encounterTotal: number;
  bossZone: ZoneState | null;
  nextZone: ZoneState | null;
}

interface ObjectiveSummary {
  badgeLabel: string;
  copy: string;
}

interface UiRenderServices {
  appEngine: AppEngineApi;
  classRegistry: ClassRegistryApi;
  combatEngine: CombatEngineApi;
  itemSystem: ItemSystemApi;
  renderUtils: RenderUtilsApi;
  runFactory: RunFactoryApi;
  townServices: TownServiceApi;
}

interface AccountTreeReviewOptions {
  showControls?: boolean;
}

interface UiCommonApi {
  getServices(): UiRenderServices;
  getBonusValue(value: unknown): number;
  getDerivedPartyState(run: RunState, content: GameContent, itemSystem: ItemSystemApi): DerivedPartyState;
  renderBootState(root: HTMLElement, bootState: BootState, renderUtils: RenderUtilsApi): void;
  renderRunStatus(run: RunState, phaseLabel: string, renderUtils: RenderUtilsApi): string;
  renderNotice(appState: AppState, renderUtils: RenderUtilsApi): string;
  buildSafeZoneSnapshot(run: RunState, runFactory: RunFactoryApi): SafeZoneSnapshot;
  getBossStatusTone(status: string | undefined): string;
  getBossStatusLabel(status: string | undefined): string;
  getObjectiveSummary(routeSnapshot: SafeZoneSnapshot): ObjectiveSummary;
  getTownFeatureLabel(featureId: string): string;
  getTutorialLabel(tutorialId: string): string;
  buildAccountTreeReviewMarkup(
    accountSummary: ProfileAccountSummary,
    renderUtils: RenderUtilsApi,
    options?: AccountTreeReviewOptions
  ): string;
}

interface UiPhaseViewApi {
  render(root: HTMLElement, appState: AppState, services: UiRenderServices): void;
}

interface Window {
  ROUGE_GAME_CONTENT: GameContent;
  ROUGE_COMBAT_ENGINE: CombatEngineApi;
  ROUGE_SEED_LOADER: SeedLoaderApi;
  ROUGE_ENCOUNTER_REGISTRY_ENEMY_BUILDERS: EncounterRegistryEnemyBuildersApi;
  ROUGE_ENCOUNTER_REGISTRY_BUILDERS: EncounterRegistryBuildersApi;
  ROUGE_CONTENT_VALIDATOR_WORLD_PATHS: ContentValidatorWorldPathsApi;
  ROUGE_CONTENT_VALIDATOR: ContentValidatorApi;
  ROUGE_ENCOUNTER_REGISTRY: EncounterRegistryApi;
  ROUGE_CLASS_REGISTRY: ClassRegistryApi;
  ROUGE_ITEM_DATA: ItemDataApi;
  ROUGE_ITEM_CATALOG: ItemCatalogApi;
  ROUGE_ITEM_LOADOUT: ItemLoadoutApi;
  ROUGE_ITEM_TOWN: ItemTownApi;
  ROUGE_ITEM_SYSTEM: ItemSystemApi;
  ROUGE_REWARD_ENGINE: RewardEngineApi;
  ROUGE_WORLD_NODES: WorldNodeEngineApi;
  ROUGE_TOWN_SERVICES: TownServiceApi;
  ROUGE_RENDER_UTILS: RenderUtilsApi;
  ROUGE_RUN_STATE: RunStateHelpersApi;
  ROUGE_RUN_ROUTE_BUILDER: RunRouteBuilderApi;
  ROUGE_RUN_PROGRESSION: RunProgressionApi;
  ROUGE_RUN_REWARD_FLOW: RunRewardFlowApi;
  ROUGE_RUN_FACTORY: RunFactoryApi;
  ROUGE_SAVE_MIGRATIONS: SaveMigrationApi;
  ROUGE_PROFILE_MIGRATIONS: ProfileMigrationApi;
  ROUGE_PERSISTENCE: PersistenceApi;
  ROUGE_APP_ENGINE: AppEngineApi;
  ROUGE_UI_COMMON: UiCommonApi;
  ROUGE_FRONT_DOOR_VIEW: UiPhaseViewApi;
  ROUGE_CHARACTER_SELECT_VIEW: UiPhaseViewApi;
  ROUGE_SAFE_ZONE_VIEW: UiPhaseViewApi;
  ROUGE_WORLD_MAP_VIEW: UiPhaseViewApi;
  ROUGE_COMBAT_VIEW: UiPhaseViewApi;
  ROUGE_REWARD_VIEW: UiPhaseViewApi;
  ROUGE_ACT_TRANSITION_VIEW: UiPhaseViewApi;
  ROUGE_RUN_SUMMARY_VIEW: UiPhaseViewApi;
  ROUGE_APP_SHELL: AppShellApi;
  ROUGE_ACTION_DISPATCHER: ActionDispatcherApi;
}
