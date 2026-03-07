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
  [key: string]: unknown;
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

interface EncounterDefinition {
  id: string;
  name: string;
  description: string;
  enemies: EncounterEnemyEntry[];
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
  summary: string;
  bonusPerRank: ItemBonusSet;
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
}

interface CombatEnemyState {
  id: string;
  templateId: string;
  name: string;
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

interface WorldNodeCatalog {
  quests: Record<number, QuestNodeDefinition>;
  shrines: Record<number, ShrineNodeDefinition>;
  events: Record<number, EventNodeDefinition>;
  opportunities: Record<number, OpportunityNodeDefinition>;
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

interface RunHistoryEntry {
  runId: string;
  classId: string;
  className: string;
  level: number;
  actsCleared: number;
  bossesDefeated: number;
  completedAt: string;
  outcome: "completed" | "failed" | "abandoned";
}

interface ProfileMetaSettings {
  showHints: boolean;
  reduceMotion: boolean;
  compactMode: boolean;
}

interface ProfileMetaProgression {
  highestLevel: number;
  totalBossesDefeated: number;
  classesPlayed: string[];
  preferredClassId: string;
  lastPlayedClassId: string;
}

interface ProfileMetaState {
  settings: ProfileMetaSettings;
  progression: ProfileMetaProgression;
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
  totalBossesDefeated: number;
  classesPlayedCount: number;
  preferredClassId: string;
}

interface CombatOverrides {
  heroState: HeroDefinition & {
    life: number;
    damageBonus: number;
    guardBonus: number;
    burnBonus: number;
  };
  mercenaryState: MercenaryDefinition & { life: number };
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
    mercenaryState?: Partial<MercenaryDefinition> | null;
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

interface SeedLoaderApi {
  SEED_ROOT: string;
  SEED_FILES: Record<string, string>;
  loadSeedBundle(): Promise<SeedBundle>;
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

interface ClassRegistryApi {
  createRuntimeContent(baseContent: GameContent, seedBundle: SeedBundle): GameContent;
  listPlayableClasses(seedBundle: SeedBundle): ClassDefinition[];
  getClassDefinition(seedBundle: SeedBundle, classId: string): ClassDefinition | null;
  getDeckProfileId(content: GameContent, classId: string): string;
  getStarterDeckForClass(content: GameContent, classId: string): string[];
  createHeroFromClass(content: GameContent, classDefinition: ClassDefinition): HeroDefinition;
  getClassProgression(content: GameContent, classId: string): RuntimeClassProgressionDefinition | null;
}

interface ItemSystemApi {
  createRuntimeContent(baseContent: GameContent, seedBundle: SeedBundle): GameContent;
  hydrateRunLoadout(run: RunState, content: GameContent): void;
  hydrateRunInventory(run: RunState, content: GameContent): void;
  hydrateProfileStash(profile: ProfileState, content: GameContent): void;
  buildEquipmentChoice(config: {
    content: GameContent;
    run: RunState;
    zone: ZoneState;
    actNumber: number;
    encounterNumber: number;
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
  getProfileSummary(profile: ProfileState | null): ProfileSummary;
  recordRunHistory(profile: ProfileState, run: RunState, outcome: RunHistoryEntry["outcome"]): void;
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
  beginZone(run: RunState, zoneId: string): ZoneBeginResult;
  getCurrentAct(run: RunState): ActState | null;
  getCurrentZones(run: RunState): ZoneState[];
  getZoneById(run: RunState, zoneId: string): ZoneState | null;
  getReachableZones(run: RunState): ZoneState[];
  recomputeZoneStatuses(run: RunState): void;
  snapshotPartyFromCombat(run: RunState, combatState: CombatState, content: GameContent): void;
  buildEncounterReward(config: { run: RunState; zone: ZoneState; combatState: CombatState; content: GameContent }): RunReward;
  applyReward(run: RunState, reward: RunReward, choiceId: string, content: GameContent): ActionResult;
  buildCombatBonuses(run: RunState, content: GameContent): ItemBonusSet;
  listProgressionActions(run: RunState, content: GameContent): TownAction[];
  applyProgressionAction(run: RunState, actionId: string, content: GameContent): ActionResult;
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
}

interface UiPhaseViewApi {
  render(root: HTMLElement, appState: AppState, services: UiRenderServices): void;
}

interface Window {
  ROUGE_GAME_CONTENT: GameContent;
  ROUGE_COMBAT_ENGINE: CombatEngineApi;
  ROUGE_SEED_LOADER: SeedLoaderApi;
  ROUGE_CONTENT_VALIDATOR: ContentValidatorApi;
  ROUGE_ENCOUNTER_REGISTRY: EncounterRegistryApi;
  ROUGE_CLASS_REGISTRY: ClassRegistryApi;
  ROUGE_ITEM_SYSTEM: ItemSystemApi;
  ROUGE_REWARD_ENGINE: RewardEngineApi;
  ROUGE_WORLD_NODES: WorldNodeEngineApi;
  ROUGE_TOWN_SERVICES: TownServiceApi;
  ROUGE_RENDER_UTILS: RenderUtilsApi;
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
