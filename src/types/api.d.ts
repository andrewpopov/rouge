interface CharacterSelectViewDetailsApi {
  PROFILE_RATING_ORDER: Array<keyof ClassSelectorProfileRatings>;
  PROFILE_RATING_LABELS: Record<keyof ClassSelectorProfileRatings, string>;
  humanize(id: string): string;
  buildLineup(entries: ClassDefinition[], selectedClassId: string | null | undefined): ClassDefinition[];
  buildSelectorChip(label: string, modifier: string, escapeHtml: (s: unknown) => string): string;
  buildStatBar(label: string, value: number, max: number, escapeHtml: (s: unknown) => string): string;
  buildSupportChip(label: string, value: string | number, escapeHtml: (s: unknown) => string): string;
  buildProfileRating(label: string, value: number, escapeHtml: (s: unknown) => string): string;
  buildTreeCard(
    tree: RuntimeClassTreeDefinition,
    treeGuide: ClassSelectorPathGuideDefinition | null,
    escapeHtml: (s: unknown) => string,
    buildBadge: (label: string, tone: string) => string
  ): string;
  buildTreeDetailModal(
    tree: RuntimeClassTreeDefinition,
    classGuide: {
      className: string;
      deckProfileLabel: string;
      roleLabel: string;
      complexity: string;
      selectionPitch: string;
      flavor: string;
      coreHook: string;
      attributeSummaryMarkup: string;
      vitalsMarkup: string;
      weaponBadgesMarkup: string;
      pathGuide: ClassSelectorPathGuideDefinition | null;
    },
    escapeHtml: (s: unknown) => string,
    buildBadge: (label: string, tone: string) => string
  ): string;
}

interface SeedLoaderApi {
  SEED_ROOT: string;
  SEED_FILES: Record<string, string>;
  loadSeedBundle(): Promise<SeedBundle>;
}

interface ClassRegistryApi {
  createRuntimeContent(baseContent: GameContent, seedBundle: SeedBundle): GameContent;
  listPlayableClasses(seedBundle: SeedBundle): ClassDefinition[];
  getClassDefinition(seedBundle: SeedBundle, classId: string): ClassDefinition | null;
  getDeckProfileId(content: GameContent, classId: string): string;
  getStarterDeckForClass(content: GameContent, classId: string): string[];
  createHeroFromClass(content: GameContent, classDefinition: ClassDefinition): HeroDefinition;
  getClassProgression(content: GameContent, classId: string): RuntimeClassProgressionDefinition | null;
  getPreferredWeaponFamilies(classId: string): string[];
}

interface RewardEngineApi {
  annotateCardRewardMetadata(content: GameContent): void;
  getCardRewardRole(cardId: string, content?: GameContent | null): CardRewardRole;
  getCardArchetypeTags(cardId: string, content?: GameContent | null): string[];
  computeArchetypeScores(run: RunState, content: GameContent): Record<string, number>;
  syncArchetypeScores(run: RunState, content: GameContent): Record<string, number>;
  getArchetypeScoreEntries(run: RunState, content: GameContent): RunArchetypeScoreSummary[];
  getDominantArchetype(
    run: RunState,
    content: GameContent
  ): { primary: RunArchetypeScoreSummary | null; secondary: RunArchetypeScoreSummary | null };
  getArchetypeCatalog(classId?: string): Record<string, Record<string, RewardEngineArchetypeCatalogEntry>>;
  getArchetypeWeaponFamilies(archetypeId: string): string[];
  getStrategicWeaponFamilies(run: RunState, content: GameContent): string[];
  buildRewardChoices(config: {
    content: GameContent;
    run: RunState;
    zone: ZoneState;
    actNumber: number;
    encounterNumber: number;
    profile?: ProfileState | null;
  }): RewardChoice[];
  applyChoice(run: RunState, choice: RewardChoice, content: GameContent): ActionResult;
  getUpgradableCardIds(run: RunState, content: GameContent): string[];
  resolveReinforceBuildReward(
    run: RunState,
    content: GameContent
  ): { effect: RewardChoiceEffect; previewLine: string };
  resolveSupportBuildReward(
    run: RunState,
    content: GameContent
  ): { effect: RewardChoiceEffect; previewLine: string };
  resolvePivotBuildReward(
    run: RunState,
    content: GameContent
  ): { effect: RewardChoiceEffect; previewLine: string };
}

interface RewardPathPreference {
  source: "tracked" | "favored" | "emerging";
  treeId: string;
  label: string;
  score: number;
  specializationStage: RunSpecializationStage;
  primaryTreeId: string;
  secondaryUtilityTreeId: string;
  primaryTrees: string[];
  supportTrees: string[];
  behaviorTags: CardBehaviorTag[];
  counterTags: CounterTag[];
}

interface RewardBuildResolution {
  effect: RewardChoiceEffect;
  previewLine: string;
}

interface RewardEngineArchetypeCatalogEntry {
  archetypeId: string;
  label: string;
  primaryTrees: string[];
  supportTrees: string[];
  weaponFamilies: string[];
  targetBand?: "flagship" | "secondary";
  behaviorTags?: CardBehaviorTag[];
  counterTags?: CounterTag[];
  splashRole?: CardSplashRole;
}

interface RewardEngineSpecializationSnapshot {
  favoredTreeId: string;
  primaryTreeId: string;
  secondaryUtilityTreeId: string;
  specializationStage: RunSpecializationStage;
  offTreeUtilityCount: number;
  offTreeDamageCount: number;
  counterCoverageTags: CounterTag[];
}

interface RewardEngineArchetypesApi {
  CARD_ROLE_LABELS: Record<CardRewardRole, string>;
  CARD_ROLE_SCORE_WEIGHTS: Record<CardRewardRole, number>;
  SUPPORT_ROLE_PRIORITY: Record<CardRewardRole, number>;
  getDeckProfileId(content: GameContent, classId: string): string;
  getCardClassId(cardId: string, card?: CardDefinition | null): string;
  getCardTree(cardId: string): string;
  annotateCardRewardMetadata(content: GameContent): void;
  getCardRewardRole(cardId: string, content?: GameContent | null): CardRewardRole;
  getCardArchetypeTags(cardId: string, content?: GameContent | null): string[];
  getArchetypeLabels(archetypeTags: string[]): string[];
  computeArchetypeScores(run: RunState, content: GameContent): Record<string, number>;
  syncArchetypeScores(run: RunState, content: GameContent): Record<string, number>;
  getArchetypeScoreEntries(run: RunState, content: GameContent): RunArchetypeScoreSummary[];
  getDominantArchetype(
    run: RunState,
    content: GameContent
  ): { primary: RunArchetypeScoreSummary | null; secondary: RunArchetypeScoreSummary | null };
  getArchetypeCatalog(classId?: string): Record<string, Record<string, RewardEngineArchetypeCatalogEntry>>;
  getArchetypeWeaponFamilies(archetypeId: string): string[];
  getStrategicWeaponFamilies(run: RunState, content: GameContent): string[];
  getSpecializationSnapshot(run: RunState, content: GameContent): RewardEngineSpecializationSnapshot;
  getRewardPathPreference(run: RunState, content: GameContent): RewardPathPreference | null;
}

interface RewardEngineBuilderApi {
  buildRewardChoices(config: {
    content: GameContent;
    run: RunState;
    zone: ZoneState;
    actNumber: number;
    encounterNumber: number;
    profile?: ProfileState | null;
  }): RewardChoice[];
  getUpgradableCardIds(run: RunState, content: GameContent): string[];
  resolveReinforceBuildReward(run: RunState, content: GameContent): RewardBuildResolution;
  resolveSupportBuildReward(run: RunState, content: GameContent): RewardBuildResolution;
  resolvePivotBuildReward(run: RunState, content: GameContent): RewardBuildResolution;
}

interface RewardEngineBuilderStrategiesApi {
  getClassPoolForZone(content: GameContent, classId: string, zoneRole: string, actNumber: number): string[];
  resolveReinforceBuildReward(run: RunState, content: GameContent): RewardBuildResolution;
  resolveSupportBuildReward(run: RunState, content: GameContent): RewardBuildResolution;
  resolvePivotBuildReward(run: RunState, content: GameContent): RewardBuildResolution;
}

interface RewardEngineApplyApi {
  applyChoice(run: RunState, choice: RewardChoice, content: GameContent): ActionResult;
}

interface TownServiceApi {
  listActions(content: GameContent, run: RunState, profile: ProfileState): TownAction[];
  applyAction(run: RunState, profile: ProfileState, content: GameContent, actionId: string): ActionResult;
}

interface SafeZoneNpcViewModel {
  id: string;
  name: string;
  role: string;
  icon: string;
  actions: TownAction[];
  emptyLabel: string;
  isMerc?: boolean;
}

interface SafeZoneViewMerchantApi {
  buildNpcOverlay(
    npc: SafeZoneNpcViewModel,
    gold: number,
    content: GameContent,
    escapeHtml: (value: string) => string
  ): string;
}

interface SaveMigrationApi {
  CURRENT_SCHEMA_VERSION: number;
  migrateSnapshot(snapshot: unknown): RunSnapshotEnvelope | null;
}

interface ProfileMigrationApi {
  CURRENT_PROFILE_SCHEMA_VERSION: number;
  migrateProfile(profile: unknown, content?: GameContent | null): ProfileEnvelope | null;
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
  serializeProfile(profile: ProfileEnvelope | ProfileState, content?: GameContent | null): string;
  restoreProfile(profileOrSerialized: unknown, content?: GameContent | null): ProfileEnvelope | null;
  saveProfileToStorage(
    profile: ProfileEnvelope | ProfileState | string,
    storage?: StorageLike | null,
    content?: GameContent | null
  ): ActionResult;
  loadProfileFromStorage(storage?: StorageLike | null, content?: GameContent | null): ProfileState | null;
  ensureProfileMeta(profile: ProfileState, content?: GameContent | null): void;
  unlockProfileEntries(profile: ProfileState, category: ProfileUnlockCategory, ids: string[]): void;
  updateProfileSettings(profile: ProfileState, patch: ProfileSettingsPatch): void;
  setPreferredClass(profile: ProfileState, classId: string): void;
  setPlannedRuneword(profile: ProfileState, slot: "weapon" | "armor", runewordId: string, content?: GameContent | null): void;
  setAccountProgressionFocus(profile: ProfileState, treeId: string): void;
  markTutorialSeen(profile: ProfileState, tutorialId: string): void;
  markTutorialCompleted(profile: ProfileState, tutorialId: string): void;
  dismissTutorial(profile: ProfileState, tutorialId: string): void;
  restoreTutorial(profile: ProfileState, tutorialId: string): void;
  syncProfileMetaFromRun(profile: ProfileState, run: RunState): void;
  getProfileSummary(profile: ProfileState | null, content?: GameContent | null): ProfileSummary;
  getAccountProgressSummary(profile: ProfileState | null, content?: GameContent | null): ProfileAccountSummary;
  getRunHistoryCapacity(profile: ProfileState | null): number;
  recordRunHistory(profile: ProfileState, run: RunState, outcome: RunHistoryEntry["outcome"], content?: GameContent | null): void;
  initializeProfileStore(content?: GameContent | null): Promise<void>;
  saveToStorage(snapshot: RunSnapshotEnvelope | string, storage?: StorageLike | null): ActionResult;
  loadFromStorage(storage?: StorageLike | null): RunSnapshotEnvelope | null;
  hasSavedSnapshot(storage?: StorageLike | null): boolean;
  clearStorage(storage?: StorageLike | null): void;
}

interface RunFactoryApi {
  createRun(config: {
    content: GameContent;
    seedBundle: SeedBundle;
    classDefinition: ClassDefinition;
    heroDefinition: HeroDefinition;
    mercenaryId: string;
    starterDeck: string[];
    runSeed?: number;
  }): RunState;
  hydrateRun(run: RunState, content: GameContent): RunState;
  createCombatOverrides(run: RunState, content: GameContent, profile?: ProfileState | null): CombatOverrides;
  beginZone(run: RunState, zoneId: string, content?: GameContent | null): ZoneBeginResult;
  getCurrentAct(run: RunState): ActState | null;
  getCurrentZones(run: RunState): ZoneState[];
  getZoneById(run: RunState, zoneId: string): ZoneState | null;
  getReachableZones(run: RunState): ZoneState[];
  recomputeZoneStatuses(run: RunState): void;
  snapshotPartyFromCombat(run: RunState, combatState: CombatState, content: GameContent, profile?: ProfileState | null): void;
  buildEncounterReward(config: { run: RunState; zone: ZoneState; combatState: CombatState; content: GameContent; profile?: ProfileState | null }): RunReward;
  applyReward(run: RunState, reward: RunReward, choiceId: string, content: GameContent): ActionResult;
  buildCombatBonuses(run: RunState, content: GameContent, profile?: ProfileState | null): ItemBonusSet;
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
  createDefaultGuideState(): RunGuideState;
  createDefaultSummary(): RunState["summary"];
  recordSummaryLifeFloor(summary: RunState["summary"] | null | undefined, actor: "hero" | "mercenary", currentLife: unknown, maxLife: unknown): void;
  syncSummaryLifeFloors(run: RunState | null | undefined): void;
  getLevelForXp(xp: unknown): number;
  getTrainingTrackForLevel(level: unknown): keyof RunProgressionState["training"];
  getTrainingRankCount(training: RunProgressionState["training"] | null | undefined): number;
  addBonusSet(total: ItemBonusSet, bonuses: ItemBonusSet | undefined, multiplier?: number): ItemBonusSet;
  describeBonusSet(bonuses: ItemBonusSet | null | undefined): string[];
  describeWeaponProfile(profile: WeaponCombatProfile | null | undefined): string[];
  describeArmorProfile(profile: ArmorMitigationProfile | null | undefined): string[];
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
  buildTrainingScreenModel(appState: AppState, content: GameContent): TrainingScreenModel | null;
  unlockTrainingSkill(run: RunState, content: GameContent, skillId: string): ActionResult;
  equipTrainingSkill(run: RunState, content: GameContent, slotKey: RunSkillBarSlotKey, skillId: string): ActionResult;
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
  setPlannedRuneword(state: AppState, slot: "weapon" | "armor", runewordId: string): ActionResult;
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
  openTrainingView(state: AppState, source?: TrainingViewSource): ActionResult;
  closeTrainingView(state: AppState): void;
  selectTrainingTree(state: AppState, treeId: string): void;
  selectTrainingSkill(state: AppState, skillId: string): void;
  selectTrainingSlot(state: AppState, slotKey: "" | RunSkillBarSlotKey): void;
  setTrainingCompare(state: AppState, skillId: string): void;
  setTrainingMode(state: AppState, mode: TrainingViewMode): void;
  unlockTrainingSkill(state: AppState, skillId: string): ActionResult;
  equipTrainingSkill(state: AppState, slotKey: RunSkillBarSlotKey, skillId: string): ActionResult;
  swapTrainingSkill(state: AppState, slotKey: RunSkillBarSlotKey, skillId: string): ActionResult;
  selectZone(state: AppState, zoneId: string): ActionResult;
  debugSkipEncounter(state: AppState): ActionResult;
  syncEncounterOutcome(state: AppState): ActionResult;
  claimRewardAndAdvance(state: AppState, choiceId?: string): ActionResult;
  continueActGuide(state: AppState): ActionResult;
  continueActTransition(state: AppState): ActionResult;
  returnToFrontDoor(state: AppState): void;
}

interface ExplorationEventChoice {
  id: string;
  title: string;
  description: string;
  effects: RewardChoiceEffect[];
  requiresCardPick?: boolean;
}

interface ExplorationEvent {
  id: string;
  kind: "card_upgrade" | "blessing" | "gamble" | "mystery" | "trader" | "trial" | "rest" | "shrine";
  title: string;
  flavor: string;
  icon: string;
  choices: ExplorationEventChoice[];
  pendingChoiceId?: string;
}

interface ExplorationEventsApi {
  rollExplorationEvent(run: RunState, zone: ZoneState, content: GameContent, seed: number): ExplorationEvent | null;
  applyExplorationEventChoice(run: RunState, event: ExplorationEvent, choiceId: string, content: GameContent, cardId?: string): ActionResult;
  getUpgradableCardIds(run: RunState, content: GameContent): string[];
}

interface AssetMapApi {
  getCardIcon(cardId: string, effects?: CardEffect[]): string;
  getCardIllustration(cardId: string): string | null;
  getMinionIllustration(templateId: string, artTier?: number): string | null;
  getCardFrame(roleKey: string): string | null;
  getEnemyIcon(templateId: string): string;
  getEnemySprite(templateId: string): string | null;
  getClassPortrait(classId: string): string | null;
  getClassSprite(classId: string): string | null;
  getMercenarySprite(role: string): string | null;
  getUiIcon(key: string): string | null;
  getIntentIcon(intentDescription: string): string;
  getItemSprite(sourceId: string, rarity?: string, slot?: string): string | null;
  getRuneSprite(sourceId: string): string | null;
}

interface CharmDataApi {
  CHARM_CATALOG: Record<string, CharmDefinition>;
  getCharmDefinition(charmId: string): CharmDefinition | null;
  listAllCharms(): CharmDefinition[];
}

interface CharmPouchSummary {
  capacity: number;
  slotsUsed: number;
  slotsRemaining: number;
  equippedCount: number;
  unlockedCount: number;
  equippedCharms: CharmDefinition[];
  unequippedCharms: CharmDefinition[];
}

interface CharmSystemApi {
  POUCH_CAPACITY: number;
  ACTION_EQUIP_PREFIX: string;
  ACTION_UNEQUIP_PREFIX: string;
  getEquippedSlotCost(profile: ProfileState | null): number;
  canEquipCharm(profile: ProfileState | null, charmId: string): boolean;
  equipCharm(profile: ProfileState, charmId: string): boolean;
  unequipCharm(profile: ProfileState, charmId: string): boolean;
  unlockCharm(profile: ProfileState, charmId: string): boolean;
  buildCharmBonuses(profile: ProfileState | null, classId?: string): ItemBonusSet;
  getCharmPouchSummary(profile: ProfileState | null): CharmPouchSummary;
  checkAndUnlockCharms(profile: ProfileState, run: RunState | null): string[];
}

interface CubeRecipeInput {
  kind: "charm" | "rune" | "equipment";
  size?: CharmSize;
  count?: number;
  rarity?: string;
}

interface CubeRecipeOutput {
  kind: "charm" | "rune_upgrade" | "charm_reroll";
  size?: CharmSize;
}

interface CubeRecipe {
  id: string;
  title: string;
  description: string;
  inputs: CubeRecipeInput[];
  output: CubeRecipeOutput;
}

interface HoradricCubeApi {
  ACTION_PREFIX: string;
  CUBE_RECIPES: CubeRecipe[];
  canExecuteRecipe(profile: ProfileState, recipeId: string): boolean;
  listAvailableRecipes(profile: ProfileState): { recipe: CubeRecipe; canExecute: boolean }[];
  buildCubeActions(profile: ProfileState): TownAction[];
  executeRecipe(profile: ProfileState, recipeId: string): ActionResult;
}

interface ClassUnlockRule {
  classId: string;
  className: string;
  description: string;
  condition: (profile: ProfileState) => boolean;
}

interface ClassUnlockRulesApi {
  ALWAYS_UNLOCKED_CLASS_IDS: string[];
  CLASS_UNLOCK_RULES: ClassUnlockRule[];
  isClassUnlocked(profile: ProfileState | null, classId: string): boolean;
  getUnlockHint(classId: string): string;
  listUnlockedClassIds(profile: ProfileState | null): string[];
  checkAndUnlockClasses(profile: ProfileState): string[];
}

// Training and app-state types in api-state.d.ts
