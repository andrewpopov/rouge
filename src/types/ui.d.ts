/* eslint-disable max-lines */
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

interface SavedRunPhaseGuidance {
  expeditionLabel: string;
  decisionLabel: string;
  nextSurfaceLabel: string;
  focusLabel: string;
  summaryLine: string;
  checklistLines: string[];
}

interface ScreenshotCombatFixtureOptions {
  classId?: string;
  mercenaryId?: string;
  handSize?: number;
  boss?: boolean;
  openPile?: "" | "draw" | "discard" | "decklist";
}

interface ScreenshotHelpersApi {
  ready: boolean;
  loadCombatFixture(options?: ScreenshotCombatFixtureOptions): boolean;
  resumeSavedRun(options?: { dismissActGuide?: boolean }): boolean;
}

interface RenderUtilsApi {
  escapeHtml(value: unknown): string;
  buildStat(label: string, value: unknown): string;
  buildStringList(lines: string[], className?: string): string;
  buildBadge(label: string, tone?: string): string;
  buildBadgeRow(labels: string[], tone?: string): string;
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

interface DerivedPartyState {
  hero: {
    currentLife: number;
    maxLife: number;
    maxEnergy: number;
    handSize: number;
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
  armorProfile?: ArmorMitigationProfile | null;
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

interface AccountMetaContinuityOptions {
  title?: string;
  copy?: string;
}

interface AccountMetaDrilldownOptions {
  title?: string;
  copy?: string;
  charterFollowThrough?: string;
  convergenceFollowThrough?: string;
}

interface ExpeditionLaunchFlowOptions {
  title?: string;
  copy?: string;
  currentStep?: "hall" | "draft" | "town";
  hallFollowThrough?: string;
  draftFollowThrough?: string;
  townFollowThrough?: string;
}

interface UiAccountMetaApi {
  getTownFeatureLabel(featureId: string): string;
  getTutorialLabel(tutorialId: string): string;
  createDefaultPlanningSummary(): ProfilePlanningSummary;
  createDefaultArchiveSummary(profileSummary: ProfileSummary): ProfileArchiveSummary;
  createDefaultStashSummary(stashEntries: number): ProfileStashSummary;
  createDefaultReviewSummary(): ProfileAccountReviewSummary;
  getPlanningCharterStageLines(planning: ProfilePlanningSummary | null, content: GameContent | null): string[];
  buildAccountMetaContinuityMarkup(
    appState: AppState,
    accountSummary: ProfileAccountSummary,
    renderUtils: RenderUtilsApi,
    options?: AccountMetaContinuityOptions
  ): string;
  buildAccountMetaDrilldownMarkup(
    appState: AppState,
    accountSummary: ProfileAccountSummary,
    renderUtils: RenderUtilsApi,
    options?: AccountMetaDrilldownOptions
  ): string;
  buildAccountTreeReviewMarkup(
    accountSummary: ProfileAccountSummary,
    renderUtils: RenderUtilsApi,
    options?: AccountTreeReviewOptions
  ): string;
}

interface UiCommonApi {
  getPreviewLabel(labels: string[], emptyLabel: string, maxItems?: number): string;
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
  createDefaultPlanningSummary(): ProfilePlanningSummary;
  createDefaultArchiveSummary(profileSummary: ProfileSummary): ProfileArchiveSummary;
  createDefaultStashSummary(stashEntries: number): ProfileStashSummary;
  createDefaultReviewSummary(): ProfileAccountReviewSummary;
  getPlanningCharterStageLines(planning: ProfilePlanningSummary | null, content: GameContent | null): string[];
  buildAccountMetaContinuityMarkup(
    appState: AppState,
    accountSummary: ProfileAccountSummary,
    renderUtils: RenderUtilsApi,
    options?: AccountMetaContinuityOptions
  ): string;
  buildAccountMetaDrilldownMarkup(
    appState: AppState,
    accountSummary: ProfileAccountSummary,
    renderUtils: RenderUtilsApi,
    options?: AccountMetaDrilldownOptions
  ): string;
  buildExpeditionLaunchFlowMarkup(
    appState: AppState,
    accountSummary: ProfileAccountSummary,
    renderUtils: RenderUtilsApi,
    options?: ExpeditionLaunchFlowOptions
  ): string;
  buildAccountTreeReviewMarkup(
    accountSummary: ProfileAccountSummary,
    renderUtils: RenderUtilsApi,
    options?: AccountTreeReviewOptions
  ): string;
}

interface UiPhaseViewApi {
  render(root: HTMLElement, appState: AppState, services: UiRenderServices): void;
}

interface TrainingViewApi {
  buildTrainingOverlay(appState: AppState, services: UiRenderServices): string;
}

interface ClassSelectorProfileRatings {
  damage: number;
  control: number;
  survivability: number;
  speed: number;
  setup: number;
}

interface ClassSelectorPathGuideDefinition {
  laneIdentity: string;
  emphasisLine: string;
}

interface ClassSelectorGuideDefinition {
  roleLabel: string;
  complexity: string;
  playstyleTags: string[];
  profileRatings: ClassSelectorProfileRatings;
  coreHook: string;
  selectionPitch: string;
  flavor: string;
  footerFlavor: string;
  pathGuides: Record<string, ClassSelectorPathGuideDefinition>;
}

interface ClassSelectorGuideApi {
  getGuide(classId: string): ClassSelectorGuideDefinition | null;
}

interface ActGuideViewApi {
  hasOverlay(run: RunState | null | undefined, phase: AppPhase): boolean;
  buildOverlayMarkup(appState: AppState, services: UiRenderServices): string;
  render(root: HTMLElement, appState: AppState, services: UiRenderServices): void;
}

interface FrontDoorHallViewApi {
  buildHallTabNav(activeSection: string): string;
  buildAccountOverviewMarkup(
    appState: AppState,
    services: UiRenderServices,
    savedRunSummary: SavedRunSummary | null,
    phaseTone: string,
    accountSummary: ProfileAccountSummary
  ): string;
  buildAccountDashboardMarkup(
    appState: AppState,
    services: UiRenderServices,
    savedRunSummary: SavedRunSummary | null,
    phaseTone: string,
    accountSummary: ProfileAccountSummary
  ): string;
  buildUnlockGalleryMarkup(appState: AppState, services: UiRenderServices, accountSummary: ProfileAccountSummary): string;
  buildVaultLogisticsMarkup(appState: AppState, services: UiRenderServices, accountSummary: ProfileAccountSummary): string;
  buildAccountControlsMarkup(appState: AppState, services: UiRenderServices, accountSummary: ProfileAccountSummary): string;
  buildVaultChronicleMarkup(
    appState: AppState,
    services: UiRenderServices,
    accountSummary: ProfileAccountSummary,
    stashPreviewLines: string[],
    recentRunMarkup: string
  ): string;
  buildCapstoneWatchMarkup(services: UiRenderServices, accountSummary: ProfileAccountSummary): string;
}

interface FrontDoorExpeditionViewApi {
  getSavedRunPhaseGuidance(savedRunSummary: SavedRunSummary, appEngine: AppEngineApi): SavedRunPhaseGuidance;
  buildHallNavigatorMarkup(
    appState: AppState,
    services: UiRenderServices,
    savedRunSummary: SavedRunSummary | null,
    accountSummary: ProfileAccountSummary
  ): string;
  buildHallDecisionSupportMarkup(
    appState: AppState,
    services: UiRenderServices,
    savedRunSummary: SavedRunSummary | null,
    accountSummary: ProfileAccountSummary
  ): string;
  buildGuidedStartMarkup(appState: AppState, services: UiRenderServices, savedRunSummary: SavedRunSummary | null): string;
  buildExpeditionSectionMarkup(appState: AppState, services: UiRenderServices, savedRunSummary: SavedRunSummary | null): string;
}

interface SafeZoneOperationsModel {
  run: RunState;
  derivedParty: DerivedPartyState;
  routeSnapshot: SafeZoneSnapshot;
  profileSummary: ProfileSummary;
  accountSummary: ProfileAccountSummary;
  townActions: TownAction[];
  healerActions: TownAction[];
  quartermasterActions: TownAction[];
  progressionActions: TownAction[];
  vendorActions: TownAction[];
  blacksmithActions: TownAction[];
  sageActions: TownAction[];
  gamblerActions: TownAction[];
  inventoryActions: TownAction[];
  stashActions: TownAction[];
  mercenaryActions: TownAction[];
  trainingRanks: number;
  carriedEntries: number;
  vendorStock: number;
  vendorRefreshes: number;
  stashEntries: number;
  questOutcomeCount: number;
  shrineOutcomeCount: number;
  eventOutcomeCount: number;
  opportunityOutcomeCount: number;
  worldOutcomeCount: number;
  preferredClassName: string;
  planningLabels: string[];
  nextTutorialLabel: string;
  missingHeroLife: number;
  missingMercenaryLife: number;
  missingBelt: number;
  spendablePointCount: number;
  progressionActionTitles: string[];
  recoveryActionTitles: string[];
  tradeActionTitles: string[];
  mercenaryActionTitles: string[];
  readinessIssues: string[];
  readinessTone: string;
  readinessBadgeLabel: string;
  debugEnabled: boolean;
  planning: ProfilePlanningSummary;
  review: ProfileAccountReviewSummary;
  stashSummary: ProfileStashSummary;
  planningOverview: ProfilePlanningOverviewSummary;
  plannedWeaponLabel: string;
  plannedArmorLabel: string;
  plannedRunewordLabels: string[];
  charterStageLines: string[];
  readyCharterCount: number;
  preparedCharterCount: number;
  townFeatureLabels: string[];
  liveBonusBadgeLabel: string;
  liveBonusTone: string;
  equippedCount: number;
  nextPrepLabel: string;
  nextPrepTone: string;
  nextPrepCopy: string;
  nextPrepLines: string[];
  routeProgressTone: string;
  objectiveTone: string;
  objectiveSummary: ObjectiveSummary;
  bossTone: string;
  bossBadgeLabel: string;
  companionTone: string;
  worldLedgerLines: string[];
  departureBriefingLines: string[];
}

interface InventoryViewApi {
  buildInventoryMarkup(appState: AppState, services: UiRenderServices): string;
}

interface SafeZoneOperationsViewApi {
  createOperationsModel(appState: AppState, services: UiRenderServices): SafeZoneOperationsModel;
  buildOperationsMarkup(appState: AppState, services: UiRenderServices, model?: SafeZoneOperationsModel): string;
  buildOperationsSections(
    appState: AppState,
    services: UiRenderServices,
    model?: SafeZoneOperationsModel
  ): Record<"departure" | "loadout" | "services" | "account" | "debug", string>;
}

interface AppShellRenderConfig {
  appState: AppState | null;
  baseContent: GameContent;
  bootState: BootState;
}

interface ViewLifecycleApi {
  managedTimeout(fn: () => void, delay: number): ReturnType<typeof setTimeout>;
  managedRAF(fn: FrameRequestCallback): number;
  registerCleanup(fn: () => void): () => void;
  cleanup(): void;
  pendingCount(): number;
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

interface ActionHandlerContext {
  actionEl: HTMLElement;
  appState: AppState;
  appEngine: AppEngineApi;
  combatEngine: CombatEngineApi;
  render: () => void;
  syncCombatResultAndRender: () => void;
}

interface CombatFxActionOptions {
  playedCardEl?: HTMLElement | null;
  sequenceEnemyPhase?: boolean;
  actionType?: "card" | "skill" | "melee" | "potion" | "end_turn";
}

interface ActionDispatcherCombatFxApi {
  doCombatAction(combat: CombatState, action: () => void, syncAndRender: () => void, options?: CombatFxActionOptions): void;
  addTempClass(el: HTMLElement, cls: string, durationMs: number): void;
}

interface ActionDispatcherRewardFxApi {
  spawnRewardParticles(sourceEl: HTMLElement): void;
}

interface ActionDispatcherKeyboardApi {
  handleKeydown(config: ActionDispatcherConfig & { event: KeyboardEvent }): boolean;
  setRunSummaryStep(appState: AppState, nextStep: string): boolean;
}

interface ActionDispatcherApi {
  handleClick(config: ActionDispatcherConfig): boolean;
  handleKeydown(config: ActionDispatcherConfig & { event: KeyboardEvent }): boolean;
}

interface RougeLimits {
  COMBAT_LOG_SIZE: number;
  STASH_PREVIEW_IDS: number;
  STASH_PREVIEW_ENTRIES: number;
  RUN_HISTORY_PREVIEW: number;
  RECENT_RUNS_SCAN: number;
  RECENT_FEATURE_IDS: number;
  RECENT_RUNEWORD_IDS: number;
  REWARD_CHOICES: number;
  CARD_CHOICES: number;
  TUTORIAL_CATEGORY_PREVIEW: number;
  TUTORIAL_ACTION_ROWS: number;
  TOWN_FEATURES_PREVIEW: number;
  WORLD_OUTCOMES_LOG: number;
  LABEL_PREVIEW: number;
  BONUS_PREVIEW: number;
  PROGRESSION_PREVIEW_LINES: number;
  MARKET_PREVIEW_LINES: number;
  PLANNING_STAGE_COMPACT: number;
  PLANNING_STAGE_EXTENDED: number;
  RECENT_RUNS_SUMMARY: number;
  NIGHTMARE_HELL_GUEST_ENEMIES: number;
  MAX_HERO_ENERGY: number;
  MAX_HERO_POTION_HEAL: number;
}

interface RougeConstants {
  COMBAT_PHASE: {
    PLAYER: CombatPhase;
    ENEMY: CombatPhase;
    VICTORY: CombatPhase;
    DEFEAT: CombatPhase;
  };
  COMBAT_OUTCOME: {
    VICTORY: "victory";
    DEFEAT: "defeat";
  };
  RUN_OUTCOME: {
    COMPLETED: "completed";
    FAILED: "failed";
    ABANDONED: "abandoned";
  };
  ZONE_KIND: {
    BATTLE: "battle";
    MINIBOSS: "miniboss";
    BOSS: "boss";
    QUEST: "quest";
    SHRINE: "shrine";
    EVENT: "event";
    OPPORTUNITY: "opportunity";
  };
  ENEMY_ROLE: {
    RAIDER: "raider";
    RANGED: "ranged";
    SUPPORT: "support";
    BRUTE: "brute";
  };
  ENTRY_KIND: {
    EQUIPMENT: "equipment";
    RUNE: "rune";
  };
  ZONE_NAME: {
    readonly BLACK_PIT: "Black Pit";
    readonly ASHFALL_HAMLET: "Ashfall Hamlet";
    readonly DEN_OF_EVIL: "Den of Evil";
    readonly TRISTRAM: "Tristram";
    readonly FORSAKEN_PALISADE: "Forsaken Palisade";
  };
  DECK_SURGERY_ZONES: Set<string>;
}

interface RogueAuthUser {
  googleId: string;
  email: string;
  name: string;
  avatarUrl: string;
}

interface RogueAuthState {
  user: RogueAuthUser | null;
  loading: boolean;
  ready: boolean;
}

interface RogueAuthApi {
  initializeGoogleAuth(): void;
  checkSession(): Promise<void>;
  handleCredentialResponse(response: { credential: string }): Promise<void>;
  renderSignInButton(container: HTMLElement): void;
  signOut(): Promise<void>;
  getAuthState(): RogueAuthState;
  onAuthChange(fn: () => void): void;
  waitUntilReady(): Promise<void>;
}

// ── Module APIs for Record<string, unknown> modules ──────────────────────────

interface MonsterFamilyOverrideDefinition {
  keywords: string[];
  traits?: MonsterTraitKind[];
  family?: string;
  roleOverride?: string;
  lifeMultiplier?: number;
  attackMultiplier?: number;
  spawnConfig?: SpawnConfig;
  buildIntents?: (scale: EncounterRegistryEnemyScale, name: string) => EnemyIntent[];
}

interface EncounterRegistryMonsterFamiliesApi {
  MONSTER_FAMILY_OVERRIDES: MonsterFamilyOverrideDefinition[];
  findFamilyOverride(name: string): MonsterFamilyOverrideDefinition | null;
}

interface EncounterRegistryEnemyBuildersDataApi {
  ROLE_KEYWORDS: Record<string, string[]>;
  ROLE_STATS: Record<string, { life: number; attack: number; guard?: number; heal?: number }>;
  ELITE_AFFIX_PROFILES: Record<string, EncounterRegistryEliteAffixProfile>;
  ACT_ELITE_PACKAGES: Record<number, { profileId: string; role: string; entryIndex: number; templateIdSuffix: string }[]>;
  buildEliteIntentSet(profile: EncounterRegistryEliteAffixProfile, scale: EncounterRegistryEnemyScale, name: string): EnemyIntent[];
  ELITE_MODIFIER_MAP: Record<string, MonsterTraitKind>;
  MONSTER_FAMILY_OVERRIDES: MonsterFamilyOverrideDefinition[];
  findFamilyOverride(name: string): MonsterFamilyOverrideDefinition | null;
}

interface BossConfigResult {
  enemyTemplateIds: string[];
  modifiers: EncounterModifier[];
}

interface EncounterRegistryBuildersBossApi {
  buildCovenantBossConfig(actNumber: number, templateIds: Record<string, string>): BossConfigResult;
  buildAftermathBossConfig(actNumber: number, templateIds: Record<string, string>): BossConfigResult;
  buildDrilledAftermathBossConfig(actNumber: number, templateIds: Record<string, string>): BossConfigResult;
  buildMobilizedAftermathBossConfig(actNumber: number, templateIds: Record<string, string>): BossConfigResult;
  buildPostedAftermathBossConfig(actNumber: number, templateIds: Record<string, string>): BossConfigResult;
}

interface EnemyPoolEntryRef {
  id?: string;
  templateId?: string;
  name: string;
  role?: string;
}

interface ActFlavorEntry {
  [key: string]: unknown;
  openingLabel: string;
  branchBattleLabel: string;
  branchMinibossLabel: string;
  bossLabel: string;
  openingDescription: string;
  branchBattleDescription: string;
  branchMinibossDescription: string;
  bossDescription: string;
  bossAdds: string[];
}

interface EncounterRegistryBuildersZonesApi {
  ACT_FLAVOR: Record<number, ActFlavorEntry>;
  getFlavor(actNumber: number): ActFlavorEntry;
  pickEntry(entries: EnemyPoolEntryRef[], index: number, fallback: EnemyPoolEntryRef): EnemyPoolEntryRef;
  pickEscortTemplate(role: string, rangedTemplateId: string, supportTemplateId: string, bruteTemplateId: string): string;
  makeEncounter(id: string, name: string, description: string, enemyTemplateIds: (string | EnemyPoolEntryRef)[], modifiers?: EncounterModifier[]): EncounterDefinition;
  buildZoneEncounterSet(config: { actNumber: number; zoneName: string; monsterNames: string[] }): { enemyCatalog: Record<string, EnemyTemplate>; encounterCatalog: Record<string, EncounterDefinition>; encounterIds: string[] } | null;
}

interface ContentValidatorRuntimeMercenariesApi {
  validateMercenaryCatalog(mercenaryCatalog: Record<string, MercenaryDefinition>, knownWorldFlagIds: Set<string>, worldNodeCatalog: WorldNodeCatalog | null | undefined, errors: string[]): void;
}

interface ContentValidatorRuntimeValidatorsApi {
  pushError(errors: string[], message: string): void;
  collectKnownWorldFlagIds(worldNodeCatalog: WorldNodeCatalog | null | undefined): Set<string>;
  validateCardAndClassContent(content: GameContent, cardCatalog: Record<string, CardDefinition>, errors: string[]): void;
  validateEnemyCatalog(enemyCatalog: Record<string, EnemyTemplate>, eliteAffixesByAct: Record<number, Set<string>>, errors: string[]): void;
  validateEncounterCatalog(encounterCatalog: Record<string, EncounterDefinition>, enemyCatalog: Record<string, EnemyTemplate>, errors: string[]): void;
  validateGeneratedActEncounters(content: GameContent, encounterCatalog: Record<string, EncounterDefinition>, eliteAffixesByAct: Record<number, Set<string>>, errors: string[]): void;
  validateConsequenceEncounterPackages(actNumber: string, content: GameContent, encounterCatalog: Record<string, EncounterDefinition>, knownWorldFlagIds: Set<string>, errors: string[]): void;
  validateConsequenceRewardPackages(actNumber: string, content: GameContent, knownWorldFlagIds: Set<string>, errors: string[]): void;
}

interface ContentValidatorWorldCatalogSectionsApi {
  validateCrossroadOpportunitySection(actKey: string, crossroadOpportunityDefinition: CrossroadOpportunityDefinition | null | undefined, questDefinition: QuestNodeDefinition | null | undefined, shrineDefinition: ShrineNodeDefinition | null | undefined, referenceState: ContentValidatorActReferenceState, errors: string[]): void;
  validateShrineOpportunitySection(actKey: string, shrineOpportunityDefinition: ShrineOpportunityDefinition | null | undefined, shrineDefinition: ShrineNodeDefinition | null | undefined, referenceState: ContentValidatorActReferenceState, errors: string[]): void;
}

interface ContentValidatorWorldCatalogInternalApi {
  validateWorldNodeCatalog(worldNodeCatalog: WorldNodeCatalog): ContentValidationReport;
}

interface GameContentMercenariesLateApi {
  mercenaryCatalogLate: Record<string, MercenaryDefinition>;
}

interface GameContentMercenariesApi {
  hero: HeroDefinition;
  mercenaryCatalog: Record<string, MercenaryDefinition>;
}

interface ConsequenceEncounterPackageEntry {
  id: string;
  title: string;
  zoneRole: string;
  requiredFlagIds: string[];
  encounterId: string;
}

interface ConsequenceRewardPackageEntry {
  id: string;
  title: string;
  zoneRole: string;
  requiredFlagIds: string[];
  grants: { gold: number; xp: number; potions: number; cards?: string[] };
}

interface GameContentEncountersLateApi {
  consequenceEncounterPackagesLate: Record<number, ConsequenceEncounterPackageEntry[]>;
}

interface GameContentEncountersApi {
  consequenceEncounterPackages: Record<number, ConsequenceEncounterPackageEntry[]>;
}

interface GameContentRewardsLateBApi {
  consequenceRewardPackagesLateB: Record<number, ConsequenceRewardPackageEntry[]>;
}

interface GameContentRewardsLateApi {
  consequenceRewardPackagesLate: Record<number, ConsequenceRewardPackageEntry[]>;
}

interface GameContentRewardsApi {
  consequenceRewardPackages: Record<number, ConsequenceRewardPackageEntry[]>;
}

interface WorldNodeCatalogQuestsApi {
  questsA: Record<number, QuestNodeDefinition>;
  questOutcomeEffect(questId: string, outcomeId: string, outcomeTitle: string, flagIds?: string[]): RewardChoiceEffect;
  nodeOutcomeEffect(nodeType: string, nodeId: string, outcomeId: string, outcomeTitle: string, flagIds?: string[]): RewardChoiceEffect;
  questFollowUpEffect(questId: string, nodeId: string, outcomeId: string, outcomeTitle: string, consequenceId: string, flagIds?: string[]): RewardChoiceEffect;
  questConsequenceEffect(questId: string, outcomeId: string, outcomeTitle: string, consequenceId: string, flagIds?: string[]): RewardChoiceEffect;
  getWorldNodeCatalogOpportunitiesApi(): WorldNodeCatalogOpportunitiesApi;
}

interface WorldNodeCatalogShrinesApi {
  questsB: Record<number, QuestNodeDefinition>;
  SHRINE_DEFINITIONS: Record<number, ShrineNodeDefinition>;
  EVENT_DEFINITIONS: Record<number, EventNodeDefinition>;
}

interface WorldNodeCatalogOppsAApi {
  opportunitiesA: Record<number, OpportunityNodeDefinition>;
}

interface WorldNodeCatalogOppsBApi {
  opportunitiesB: Record<number, OpportunityNodeDefinition>;
}

interface AccountProgressionTreeNode {
  id: string;
  title?: string;
  description?: string;
  rewardFeatureId: string;
  tier?: number;
  isCapstone?: boolean;
  prerequisiteIds: string[];
  target: number;
  getProgress: (metrics: Record<string, number>) => number;
}

interface AccountProgressionTree {
  id: string;
  title?: string;
  description?: string;
  nodes: AccountProgressionTreeNode[];
}

interface AccountConvergenceDefinition {
  id: string;
  title?: string;
  description?: string;
  rewardFeatureId: string;
  effectSummary?: string;
  requiredFeatureIds: string[];
}

interface PersistenceCoreApi {
  SCHEMA_VERSION: number;
  STORAGE_KEY: string;
  PROFILE_STORAGE_KEY: string;
  CORE_TOWN_FEATURE_IDS: string[];
  ACCOUNT_PROGRESSION_TREES: AccountProgressionTree[];
  uniqueStrings(values: unknown): string[];
  toNumber(value: unknown, fallback: number): number;
  sanitizePlannedRunewordId(runewordId: unknown, slot: string, content: GameContent | null): string;
  sanitizePlanningState(profile: ProfileState, content?: GameContent | null): void;
  createSnapshot(config: { phase: string; selectedClassId: string; selectedMercenaryId: string; run: RunState }): RunSnapshotEnvelope;
  createEmptyProfile(): ProfileState;
  buildProfileMetrics(profile: ProfileState | null): Record<string, number>;
  listAccountMilestoneSummaries(profile: ProfileState | null): ProfileAccountMilestoneSummary[];
  getDefaultFocusedTreeId(profile: ProfileState | null): string;
  getFocusedTreeId(profile: ProfileState | null): string;
  getAccountTreeSummaries(profile: ProfileState | null): ProfileAccountTreeSummary[];
  getAccountConvergenceSummaries(profile: ProfileState | null): ProfileAccountConvergenceSummary[];
  getRunHistoryCapacity(profile: ProfileState | null): number;
  applyDerivedAccountUnlocks(profile: ProfileState): void;
  ensureMeta(profile: ProfileState, content?: GameContent | null): void;
  getDefaultStorage(): StorageLike | null;
  serializeSnapshot(snapshot: RunSnapshotEnvelope): string;
  restoreSnapshot(snapshotOrSerialized: unknown): RunSnapshotEnvelope | null;
  serializeProfile(profile: ProfileState | ProfileEnvelope, content?: GameContent | null): string;
  restoreProfile(profileOrSerialized: unknown, content?: GameContent | null): ProfileEnvelope | null;
  saveProfileToStorage(profile: ProfileState | ProfileEnvelope | string, storage?: StorageLike | null, content?: GameContent | null): { ok: boolean; message?: string };
  loadProfileFromStorage(storage?: StorageLike | null, content?: GameContent | null): ProfileState | null;
}

interface PersistenceCoreDataApi {
  CORE_TOWN_FEATURE_IDS: string[];
  ACCOUNT_PROGRESSION_TREES: AccountProgressionTree[];
  ACCOUNT_CONVERGENCES: AccountConvergenceDefinition[];
}

interface PersistencePlanningApi {
  buildPlanningSummary(profile: ProfileState | null, content?: GameContent | null): ProfilePlanningSummary;
}

interface ProfileMigrationsDataApi {
  CURRENT_PROFILE_SCHEMA_VERSION: number;
  CORE_TOWN_FEATURE_IDS: string[];
  ACCOUNT_PROGRESSION_TREES: AccountProgressionTree[];
  ACCOUNT_CONVERGENCES: AccountConvergenceDefinition[];
  deepClone<T>(value: T): T;
  isObject(value: unknown): boolean;
  toNumber(value: unknown, fallback: number): number;
  uniqueStrings(values: unknown): string[];
  sanitizePlannedRunewordId(runewordId: unknown, slot: string, content: GameContent | null): string;
  sanitizeHistoryPlanningEntry(entry: RunHistoryEntry, content?: GameContent | null): RunHistoryEntry;
  ensureHistoryEntry(entry: unknown, content?: GameContent | null): RunHistoryEntry | null;
}

interface ExplorationEventTemplatesApi {
  SHRINE_EVENTS: EventTemplate[];
  BLESSING_EVENTS: EventTemplate[];
  GAMBLE_EVENTS: EventTemplate[];
  TRADER_EVENTS: EventTemplate[];
  MYSTERY_EVENTS: EventTemplate[];
  REST_EVENTS: EventTemplate[];
  TRIAL_EVENTS: EventTemplate[];
  getUpgradableCardIds(run: RunState, content: GameContent): string[];
}

interface RewardEngineProgressionApi {
  pickProgressionChoice(zone: ZoneState, seed: number, run: RunState, actNumber: number, content: GameContent, profile?: ProfileState | null): RewardChoice | null;
  getRewardAccountFeatures(profile: ProfileState | null | undefined): Record<string, boolean>;
  scaleGoldValue(value: number, profile: ProfileState | null | undefined): number;
  describeEffectPreview(effect: RewardChoiceEffect): string;
  buildBoonChoice(boonDefinition: { id: string; title: string; subtitle: string; description: string; effects: RewardChoiceEffect[] }): RewardChoice;
}

interface RewardStrategyScoringApi {
  getBaseCardId(cardId: string): string;
  getEvolutionTerminalCardId(cardId: string): string;
  getDeckCardCopyCount(run: RunState, cardId: string): number;
  getDeckEvolutionFamilyCount(run: RunState, cardId: string): number;
  getEvolutionFamilyDuplicateLimit(cardId: string, content: GameContent): number;
}

interface RewardStrategyNeedScoringApi {
  getPrimaryRoleCounts(run: RunState, content: GameContent, buildPath: unknown): Record<string, number>;
  getReinforcementNeedScore(...args: unknown[]): number;
}

interface RewardBuilderStrategyHelpersApi {
  getPoolCandidates(pool: string[], usedCardIds: Set<string>, content: GameContent): string[];
  getSupportSplashCap(buildPath: unknown): number;
  getUpgradableCardIds(run: RunState, content: GameContent): string[];
  sortReinforceCandidates(cardIds: string[], content: GameContent, buildPath: unknown, run: RunState): string[];
  sortSupportCandidates(cardIds: string[], content: GameContent, buildPath: unknown, run: RunState): string[];
  sortPivotCandidates(cardIds: string[], content: GameContent, primaryArchetypeId: string, pivotArchetypeId: string, run: RunState): string[];
  getClassPoolForZone(content: GameContent, classId: string, zoneRole: string, actNumber: number): string[];
  getStrategicRewardPool(run: RunState, content: GameContent): string[];
  filterCardsByPathPriority(cardIds: string[], content: GameContent, buildPath: unknown, mode: "primary" | "support"): string[];
  isUtilitySplashCandidate(cardId: string, content: GameContent, buildPath: unknown): boolean;
  countCardsInTrees(run: RunState, trees?: string[]): number;
  getUtilitySplashCardCount(run: RunState, content: GameContent, buildPath: unknown): number;
  thinCandidatesByDuplicateLimit(cardIds: string[], run: RunState, content: GameContent): string[];
}

interface AppEngineProfileApi {
  getProfileSummary(state?: AppState | null): ProfileSummary;
  getAccountProgressSummary(state?: AppState | null): ProfileAccountSummary;
  mutateProfileMeta(state: AppState, applyMutation: (persistence: PersistenceApi, profile: ProfileState) => void): ActionResult;
  updateProfileSettings(state: AppState, patch: ProfileSettingsPatch): ActionResult;
  setPreferredClass(state: AppState, classId: string): ActionResult;
  setPlannedRuneword(state: AppState, slot: "weapon" | "armor", runewordId: string): ActionResult;
  setAccountProgressionFocus(state: AppState, treeId: string): ActionResult;
  markTutorialSeen(state: AppState, tutorialId: string): ActionResult;
  completeTutorial(state: AppState, tutorialId: string): ActionResult;
  dismissTutorial(state: AppState, tutorialId: string): ActionResult;
  restoreTutorial(state: AppState, tutorialId: string): ActionResult;
}

interface ItemCatalogProfileDataApi {
  RARITY: Record<string, string>;
  SLOT_FAMILY_DEFAULTS: Record<string, string>;
  WEAPON_ATTACK_PROFILES: Record<string, unknown>;
  WEAPON_SUPPORT_PROFILES: Record<string, unknown>;
  PRIMARY_WEAPON_PROFICIENCY_BY_FAMILY: Record<string, string>;
  WEAPON_DAMAGE_PROFILES: Record<string, unknown>;
  WEAPON_EFFECT_PROFILES: Record<string, unknown>;
  WEAPON_AFFIX_POOLS: Record<string, unknown>;
  ARMOR_AFFIX_POOL: unknown[];
  ARMOR_IMMUNITY_POOL: unknown[];
  UNIQUE_ARMOR_IMMUNITY_CHANCE: number;
  EXTRA_BONUS_POOL: unknown[];
  UNIQUE_EXTRA_BONUS_POOL: unknown[];
  getRarityAffixCount(rarityKind: string): number;
  scaleWeaponTreeBonus(baseValue: number, progressionTier: number, family: string): number;
  scaleWeaponDamageAmount(baseValue: number, progressionTier: number, family: string): number;
  scaleWeaponEffectAmount(effect: WeaponEffectDefinition, progressionTier: number, family: string): number;
  scaleArmorResistanceAmount(value: number, tier: number): number;
  getRarityKind(rarity: string | undefined): string;
  normalizeRarity(rarityKind: string): string;
  getRarityLabel(rarityKind: string): string;
  getRarityTuning(rarity: string | undefined): { multiplier: number; extraLineCount: number; weaponBonus: number; damageBonus: number; effectBonus: number };
  getZoneRarityKind(zoneKind: string, randomFn: RandomFn): string;
}

interface SkillEvolutionEntry {
  targetId: string;
  requiredTier: number;
  requiredActMin: number;
}

interface SkillEvolutionGenericUpgrade {
  id: string;
  name: string;
  description: string;
  cost: number;
}

interface SkillEvolutionApi {
  CARD_TREE_MAP: Record<string, string>;
  CARD_PROFICIENCY_MAP: Record<string, string>;
  EVOLUTION_CHAINS: Record<string, SkillEvolutionEntry>;
  EVOLUTION_COST: Record<number, number>;
  GENERIC_UPGRADES: SkillEvolutionGenericUpgrade[];
  MAX_UPGRADE_SLOTS: number;
  getCardProficiency(cardId: string): string;
  getCardTree(cardId: string): string;
  getEvolution(cardId: string): SkillEvolutionEntry | null;
  getEvolutionTerminalCardId(cardId: string): string;
  getEvolutionCost(targetTier: number): number;
  getGenericUpgrades(): SkillEvolutionGenericUpgrade[];
  getMaxUpgradeSlots(): number;
  getSagePurgeCost(purgeCount: number): number;
  getSageTransformCost(): number;
  getSynergyDamageBonus(cardId: string, deck: string[]): number;
  getTreeCostReduction(cardId: string, deck: string[], cardCatalog: Record<string, CardDefinition>): number;
  canEvolve(cardId: string, run: RunState): boolean;
  listEvolvableCards(run: RunState): Array<{ cardId: string; targetId: string; cost: number }>;
}

interface TrainingSlotMetaMap {
  slot1: { slotNumber: 1; roleLabel: string; lockedLabel: string };
  slot2: { slotNumber: 2; roleLabel: string; lockedLabel: string };
  slot3: { slotNumber: 3; roleLabel: string; lockedLabel: string };
}

interface RunProgressionHelpersApi {
  TRAINING_SLOT_META: TrainingSlotMetaMap;
  getClassProgression(content: GameContent, classId: string): RuntimeClassProgressionDefinition | null;
  listClassTrees(definition: RuntimeClassProgressionDefinition | null): RuntimeClassTreeDefinition[];
  getTreeRank(run: RunState, treeId: string): number;
  syncArchetypeProgression(run: RunState, content: GameContent): void;
  getSkillTreeForSkill(definition: RuntimeClassProgressionDefinition | null, skillId: string): RuntimeClassTreeDefinition | null;
  getSkillDefinition(definition: RuntimeClassProgressionDefinition | null, skillId: string): RuntimeClassSkillDefinition | null;
  getAllClassSkills(definition: RuntimeClassProgressionDefinition | null): RuntimeClassSkillDefinition[];
  getStarterSkill(definition: RuntimeClassProgressionDefinition | null): RuntimeClassSkillDefinition | null;
  getDefaultFavoredTreeId(run: RunState, definition: RuntimeClassProgressionDefinition | null): string;
  getNormalizedLearnedSkillIds(run: RunState, definition: RuntimeClassProgressionDefinition | null): string[];
  getTreeEligibleSkills(run: RunState, tree: RuntimeClassTreeDefinition): RuntimeClassSkillDefinition[];
  getTreeEligibleCount(run: RunState, tree: RuntimeClassTreeDefinition): number;
  getTreeLearnedCount(run: RunState, tree: RuntimeClassTreeDefinition): number;
  hasLearnedBridgeSkill(run: RunState, tree: RuntimeClassTreeDefinition): boolean;
  isTreeFavoredForCapstone(run: RunState, definition: RuntimeClassProgressionDefinition | null, treeId: string): boolean;
  isBridgeSlotUnlocked(run: RunState, tree: RuntimeClassTreeDefinition): boolean;
  isCapstoneSlotUnlocked(run: RunState, definition: RuntimeClassProgressionDefinition | null, tree: RuntimeClassTreeDefinition): boolean;
  isTrainingSlotUnlocked(run: RunState, definition: RuntimeClassProgressionDefinition | null, slotKey: RunSkillBarSlotKey, tree?: RuntimeClassTreeDefinition | null): boolean;
  getSkillEligibility(run: RunState, definition: RuntimeClassProgressionDefinition | null, tree: RuntimeClassTreeDefinition, skill: RuntimeClassSkillDefinition): { eligible: boolean; gateLabel: string };
  isSkillEquippableInSlot(run: RunState, definition: RuntimeClassProgressionDefinition | null, slotKey: RunSkillBarSlotKey, skillId: string): boolean;
  normalizeEquippedSkillBar(run: RunState, definition: RuntimeClassProgressionDefinition | null, learnedSkillIds: string[]): RunEquippedSkillBarState;
  updateFavoredTree(run: RunState, treeId: string): void;
  getTreeContributionBonuses(run: RunState, tree: RuntimeClassTreeDefinition): ItemBonusSet;
  getTreeNextUnlockLabel(run: RunState, definition: RuntimeClassProgressionDefinition | null, tree: RuntimeClassTreeDefinition): string;
  syncUnlockedClassSkills(run: RunState, content: GameContent): void;
  buildProgressionBonuses(run: RunState, content: GameContent): ItemBonusSet;
  getProgressionSummary(run: RunState, content: GameContent): RunProgressionSummary;
  applyTrainingRank(run: RunState, track: string): void;
  syncLevelProgression(run: RunState): void;
}

interface AssetMapDataApi {
  UNIQUE_ART_BASE: string;
  CARD_ILLUSTRATION_BASE: string;
  MINION_ILLUSTRATION_BASE: string;
  CARD_FRAME_BASE: string;
  SPRITE_BASE: string;
  PORTRAIT_BASE: string;
  CARD_ICONS: Record<string, string>;
  CARD_ILLUSTRATIONS: Record<string, string>;
  MINION_ILLUSTRATIONS: Record<string, string>;
  CARD_FRAMES: Record<string, string>;
  ATTACK_ICONS: string[];
  SKILL_ICONS: string[];
  ENEMY_SVGS: string[];
  UI_ICONS: Record<string, string>;
  INTENT_ICONS: Record<string, string>;
  CLASS_PORTRAITS: Record<string, string>;
  KNOWN_ENEMY_SPRITES: Set<string>;
  VARIANT_SPRITE_MAP: Record<string, string>;
  ENEMY_FALLBACK_DEFAULTS: Record<string, string>;
  ENEMY_FALLBACK_RULES: Array<{ icon: string; keywords: string[] }>;
  BROKEN_ENEMY_SPRITES: Set<string>;
  BROKEN_BOSS_SPRITES: Set<string>;
  ITEM_SPRITES: Record<string, string>;
  RUNE_SPRITES: Record<string, string>;
}

interface MerchantPresentationDefinition {
  key: string;
  label: string;
  icon: string;
  portraitKey: string;
}

interface SafeZoneViewMerchantPresentationApi {
  MERCHANT_PRESENTATIONS: Record<string, { epithet: string; quote: string; footer: string }>;
  toTitleCase(str: string): string;
  toPortraitKey(name: string): string;
  getNpcThemeKey(npc: SafeZoneNpcViewModel): string;
  getMerchantActionLabel(action: TownAction): string;
  getMerchantActionIcon(action: TownAction): string;
  buildNpcServiceLayout(npc: SafeZoneNpcViewModel, themeKey: string, escapeHtml: (s: string) => string): string;
  buildEmptyOverlayState(npc: SafeZoneNpcViewModel, themeKey: string, escapeHtml: (s: string) => string): string;
}

interface Window {
  ROGUE_AUTH: RogueAuthApi;
  ROUGE_UTILS: RougeUtilsApi;
  ROUGE_LIMITS: RougeLimits;
  ROUGE_CONSTANTS: RougeConstants;
  __ROUGE_SCREENSHOT_HELPERS: ScreenshotHelpersApi;
  __ROUGE_MAIN_CARD_PREVIEW: { initCardPreview: (root: HTMLElement, getAppState: () => AppState | null) => void };
  __ROUGE_MAIN_SKILL_PREVIEW_READOUTS: { buildExactSkillPreviewReadouts: (combat: CombatState, skill: CombatEquippedSkillState, helpers: Record<string, unknown>) => Record<string, unknown> | null } | undefined;
  ROUGE_GAME_CONTENT: GameContent;
  ROUGE_DEBUG: DebugModeConfig | null;
  __ROUGE_COMBAT_UTILS: CombatUtilsApi;
  __ROUGE_CARD_BEHAVIOR_DATA: CardBehaviorDataApi;
  __ROUGE_COMBAT_ENGINE_HELPERS: CombatEngineHelpersApi;
  __ROUGE_COMBAT_ENGINE_SKILLS: CombatEngineSkillsApi;
  __ROUGE_COMBAT_CARD_RUNTIME: { cardSpecificBehaviorIds: string[] };
  ROUGE_COMBAT_ENGINE: CombatEngineApi;
  ROUGE_COMBAT_MODIFIERS: CombatModifiersApi;
  ROUGE_SEED_LOADER: SeedLoaderApi;
  __ROUGE_ENCOUNTER_REGISTRY_MONSTER_FAMILIES: EncounterRegistryMonsterFamiliesApi;
  __ROUGE_ENCOUNTER_REGISTRY_ENEMY_BUILDERS_DATA: EncounterRegistryEnemyBuildersDataApi;
  __ROUGE_ENCOUNTER_REGISTRY_ENEMY_BUILDERS: EncounterRegistryEnemyBuildersApi;
  __ROUGE_ENCOUNTER_REGISTRY_BUILDERS_BOSS: EncounterRegistryBuildersBossApi;
  __ROUGE_ENCOUNTER_REGISTRY_BUILDERS_ZONES: EncounterRegistryBuildersZonesApi;
  __ROUGE_ENCOUNTER_REGISTRY_BUILDERS: EncounterRegistryBuildersApi;
  __ROUGE_CONTENT_VALIDATOR_WORLD_PATHS: ContentValidatorWorldPathsApi;
  __ROUGE_CONTENT_VALIDATOR_WORLD_OPPORTUNITIES: ContentValidatorWorldOpportunitiesApi;
  __ROUGE_CVWO_HELPERS: {
    pushError(errors: string[], message: string): void;
    validateStringIdList(values: unknown, label: string, errors: string[]): void;
    validateKnownStringIds(values: unknown, knownValues: Set<string>, label: string, errors: string[], referenceType: string): void;
    validateGrants(grants: unknown, label: string, errors: string[]): void;
    validateNodeChoice(definition: unknown, choiceDefinition: unknown, label: string, expectedNodeType: string, errors: string[], linkedQuestId?: string): void;
    validateRewardDefinition(definition: unknown, label: string, expectedNodeType: string, errors: string[], linkedQuestId?: string): void;
    validateOpportunityShell(definition: unknown, label: string, errors: string[]): void;
    validateRequiredNodeReference(definition: unknown, label: string, fieldName: string, expectedDefinition: unknown, referenceLabel: string, errors: string[]): void;
    validateReserveStyleOpportunityVariants(options: unknown): void;
  };
  __ROUGE_CVWO_FAMILIES_A: {
    validateReserveOpportunityFamily(options: unknown): void;
    validateRelayOpportunityFamily(options: unknown): void;
    validateCulminationOpportunityFamily(options: unknown): void;
    validateLegacyOpportunityFamily(options: unknown): void;
    validateReckoningOpportunityFamily(options: unknown): void;
  };
  __ROUGE_CVWO_FAMILIES_C: {
    validateDetourOpportunityFamily(options: unknown): void;
    validateEscalationOpportunityFamily(options: unknown): void;
  };
  __ROUGE_CVWO_FAMILIES_B: {
    validateRecoveryOpportunityFamily(options: unknown): void;
    validateAccordOpportunityFamily(options: unknown): void;
    validateCovenantOpportunityFamily(options: unknown): void;
    validateDetourOpportunityFamily(options: unknown): void;
    validateEscalationOpportunityFamily(options: unknown): void;
  };
  __ROUGE_CV_RUNTIME_MERCENARIES: ContentValidatorRuntimeMercenariesApi;
  __ROUGE_CV_RUNTIME_VALIDATORS: ContentValidatorRuntimeValidatorsApi;
  __ROUGE_CONTENT_VALIDATOR_RUNTIME_CONTENT: ContentValidatorRuntimeContentApi;
  __ROUGE_CV_WORLD_CATALOG_SECTIONS: ContentValidatorWorldCatalogSectionsApi;
  __ROUGE_CV_WORLD_CATALOG: ContentValidatorWorldCatalogInternalApi;
  ROUGE_CONTENT_VALIDATOR: ContentValidatorApi;
  ROUGE_ENCOUNTER_REGISTRY: EncounterRegistryApi;
  ROUGE_CLASS_REGISTRY: ClassRegistryApi;
  ROUGE_ITEM_DATA: ItemDataApi;
  __ROUGE_ITEM_DATA_RUNES: ItemDataRunesApi;
  __ROUGE_ITEM_CATALOG_PROFILES: ItemCatalogProfilesApi;
  __ROUGE_ITEM_CATALOG_RUNTIME_CONTENT: ItemCatalogRuntimeContentApi;
  ROUGE_ITEM_CATALOG: ItemCatalogApi;
  ROUGE_ITEM_LOADOUT: ItemLoadoutApi;
  __ROUGE_GC_MERCENARIES_LATE: GameContentMercenariesLateApi;
  __ROUGE_GC_MERCENARIES: GameContentMercenariesApi;
  __ROUGE_GC_ENCOUNTERS_LATE: GameContentEncountersLateApi;
  __ROUGE_GC_ENCOUNTERS: GameContentEncountersApi;
  __ROUGE_GC_REWARDS_LATE_B: GameContentRewardsLateBApi;
  __ROUGE_GC_REWARDS_LATE: GameContentRewardsLateApi;
  __ROUGE_GC_REWARDS: GameContentRewardsApi;
  __ROUGE_CLASS_CARDS_STAGING: Record<string, {
    cards: Record<string, CardDefinition>;
    starterDeck: string[];
    rewardPool: ClassRewardTiers;
  }>;
  __ROUGE_CLASS_CARDS: {
    classCardCatalog: Record<string, CardDefinition>;
    classStarterDecks: Record<string, string[]>;
    classRewardPools: Record<string, ClassRewardTiers>;
  };
  __ROUGE_WNC_QUESTS: WorldNodeCatalogQuestsApi;
  __ROUGE_WNC_SHRINES: WorldNodeCatalogShrinesApi;
  __ROUGE_WNC_OPPS_A: WorldNodeCatalogOppsAApi;
  __ROUGE_WNC_OPPS_B: WorldNodeCatalogOppsBApi;
  __ROUGE_PERSISTENCE_CORE: PersistenceCoreApi;
  __ROUGE_PERSISTENCE_CORE_DATA: PersistenceCoreDataApi;
  __ROUGE_PERSISTENCE_PLANNING: PersistencePlanningApi;
  __ROUGE_PERSISTENCE_SUMMARIES: PersistenceSummariesApi;
  __ROUGE_PROFILE_MIGRATIONS_DATA: ProfileMigrationsDataApi;
  __ROUGE_MONSTER_TRAITS: MonsterTraitsApi;
  __ROUGE_COMBAT_LOG: CombatLogApi;
  __ROUGE_COMBAT_AUDIO: {
    cardPlay(): void;
    hit(damage: number): void;
    guardBlock(): void;
    guardBreak(): void;
    enemyDeath(): void;
    heal(): void;
    statusApply(): void;
    turnStart(): void;
    victory(): void;
    defeat(): void;
    skillUse(): void;
    meleeStrike(): void;
    potionUse(): void;
    summon(): void;
    setMuted(value: boolean): void;
    setVolume(value: number): void;
    isMuted(): boolean;
  };
  __ROUGE_COMBAT_MONSTER_ACTIONS: CombatMonsterActionsApi;
  __ROUGE_COMBAT_MERCENARY: CombatMercenaryApi;
  __ROUGE_COMBAT_WEAPON_SCALING: CombatWeaponScalingApi;
  __ROUGE_COMBAT_MINIONS: CombatMinionsApi;
  __ROUGE_COMBAT_WEAPON_EFFECTS: CombatWeaponEffectsApi;
  __ROUGE_COMBAT_ENGINE_DAMAGE: {
    hasTrait(enemy: CombatEnemyState, trait: MonsterTraitKind): boolean;
    healEntity(entity: CombatHeroState | CombatMercenaryState | CombatEnemyState, amount: number): number;
    applyGuard(entity: CombatHeroState | CombatMercenaryState | CombatEnemyState, amount: number): number;
    trackLowestLife(state: CombatState, entity: CombatHeroState | CombatMercenaryState | CombatEnemyState): void;
    handleDefeat(state: CombatState, entity: CombatHeroState | CombatMercenaryState | CombatEnemyState): void;
    dealDamage(state: CombatState, entity: CombatHeroState | CombatMercenaryState | CombatEnemyState, amount: number, damageType?: DamageType): number;
    dealDirectDamage(state: CombatState, entity: CombatHeroState | CombatMercenaryState | CombatEnemyState, amount: number, damageType?: DamageType): number;
    dealDamageIgnoringGuard(state: CombatState, entity: CombatEnemyState, amount: number, ignoreGuard: number, damageType?: DamageType): number;
    dealLifeDamage(state: CombatState, entity: CombatEnemyState, amount: number): number;
  };
  __ROUGE_COMBAT_ENGINE_MINION_ACTIONS: {
    summonMinion(state: CombatState, effect: CardEffect): string;
    chooseMinionTarget(state: CombatState, minion: CombatMinionState): CombatEnemyState | null;
    resolveMinionAction(state: CombatState, minion: CombatMinionState): void;
    resolveMinionPhase(state: CombatState): void;
    getMinionStackCount(minion: CombatMinionState): number;
    getMinionArtTier(minion: CombatMinionState, maxTier?: number): number;
  };
  __ROUGE_COMBAT_ENGINE_ENEMY_TURNS: {
    chooseEnemyTarget(state: CombatState, rule: EnemyIntentTarget | undefined): CombatHeroState | CombatMercenaryState | null;
    resolveEnemyAction(state: CombatState, enemy: CombatEnemyState): void;
    advanceEnemyIntents(state: CombatState): void;
  };
  __ROUGE_COMBAT_ENGINE_TURNS: CombatTurnsApi;
  __ROUGE_CARD_EFFECTS: CombatCardEffectsApi;
  __ROUGE_APPROACH_BONUS: {
    pickBonus(approach: string, seed: number): { id: string; label: string };
    applyBonus(combat: CombatState, bonusId: string): void;
  };
  __ROUGE_EXPLORATION_EVENT_TEMPLATES: ExplorationEventTemplatesApi;
  __ROUGE_REWARD_ENGINE_PROGRESSION: RewardEngineProgressionApi;
  __ROUGE_REWARD_ENGINE_ARCHETYPES: RewardEngineArchetypesApi;
  __ROUGE_REWARD_STRATEGY_SCORING: RewardStrategyScoringApi;
  __ROUGE_REWARD_STRATEGY_NEED_SCORING: RewardStrategyNeedScoringApi;
  __ROUGE_REWARD_BUILDER_STRATEGY_HELPERS: RewardBuilderStrategyHelpersApi;
  __ROUGE_REWARD_ENGINE_BUILDER_STRATEGIES: RewardEngineBuilderStrategiesApi;
  __ROUGE_REWARD_ENGINE_BUILDER: RewardEngineBuilderApi;
  __ROUGE_REWARD_ENGINE_APPLY: RewardEngineApplyApi;
  __ROUGE_APP_ENGINE_PROFILE: AppEngineProfileApi;
  __ROUGE_ITEM_DATA_ACCESSORIES: Record<string, ItemTemplateDefinition>;
  __ROUGE_ITEM_CATALOG_PROFILE_DATA: ItemCatalogProfileDataApi;
  __ROUGE_ITEM_TOWN_PRICING: ItemTownPricingApi;
  __ROUGE_ITEM_TOWN_VENDOR_OFFERS: ItemTownVendorOffersApi;
  __ROUGE_ITEM_TOWN_VENDOR: ItemTownVendorApi;
  __ROUGE_ITEM_TOWN_ACTIONS: ItemTownActionsApi;
  __ROUGE_ITEM_TOWN_DECK_SERVICES: ItemTownDeckServicesApi;
  __ROUGE_SKILL_EVOLUTION: SkillEvolutionApi;
  __ROUGE_ITEM_SYSTEM_REWARDS: ItemSystemRewardsApi;
  __ROUGE_ITEM_SYSTEM_LOOT: ItemSystemLootApi;
  __ROUGE_ITEM_SYSTEM_CHOICE: ItemSystemChoiceApi;
  ROUGE_ITEM_TOWN: ItemTownApi;
  ROUGE_ITEM_SYSTEM: ItemSystemApi;
  ROUGE_REWARD_ENGINE: RewardEngineApi;
  ROUGE_EXPLORATION_EVENTS: ExplorationEventsApi;
  __ROUGE_COMBAT_VIEW_PREVIEW: CombatViewPreviewApi;
  __ROUGE_SKILL_PREVIEW_DATA: {
    SKILL_MODIFIER_MAP: Record<string, Array<Record<string, unknown>>>;
    SKILL_PASSIVE_MAP: Record<string, Array<Record<string, unknown>>>;
    getStaticActiveSkillPreview(skillId: string, combat: CombatState): string | null;
    renderModPart(part: Record<string, unknown>, scale: number): string;
    renderPassivePart(part: Record<string, unknown>, scale: number): string;
  };
  __ROUGE_COMBAT_VIEW_PREVIEW_SKILLS: {
    buildSkillPreviewOutcome(combat: CombatState, skill: CombatEquippedSkillState, selectedEnemy: CombatEnemyState | null): string;
    buildPassiveSkillOpeningPreview(combat: CombatState, skill: CombatEquippedSkillState): { hero: string[]; mercenary: string[]; deck: string[] };
    getExactSkillModifierPreviewParts(skill: CombatEquippedSkillState, combat?: CombatState | null): string[];
  };
  __ROUGE_COMBAT_VIEW_PRESSURE: CombatViewPressureApi;
  __ROUGE_COMBAT_VIEW_RENDERERS: CombatViewRenderersModuleApi;
  __ROUGE_COMBAT_VIEW_RENDERERS_PILE: CombatViewRenderersPileApi;
  __ROUGE_COMBAT_VIEW_RENDERERS_DECKLIST: CombatViewRenderersDecklistApi;
  __ROUGE_ZONE_FLAVOR: { getZoneFlavor(eventId: string, zoneTitle: string): string | null; resolveZoneEnv(zoneTitle: string): string | null };
  __ROUGE_OPP_HELPERS: {
    nodeOutcomeEffect(nodeType: string, nodeId: string, outcomeId: string, outcomeTitle: string, flagIds?: string[]): RewardChoiceEffect;
    questConsequenceEffect(questId: string, outcomeId: string, outcomeTitle: string, consequenceId: string, flagIds?: string[]): RewardChoiceEffect;
    buildOpportunityChoiceFactory(subtitle: string): (
      nodeId: string, questId: string, outcomeId: string,
      title: string, description: string, consequenceId: string,
      flagIds?: string[], extraEffects?: RewardChoiceEffect[]
    ) => WorldNodeChoiceDefinition;
    buildLateRouteVariant(
      choiceBuilder: (...args: unknown[]) => WorldNodeChoiceDefinition,
      nodeId: string, questId: string, variantDefinition: {
        id: string; title: string; description: string; summary: string;
        grants?: RewardGrants; requiresFlagIds?: string[];
        choice: { outcomeId: string; title: string; description: string; consequenceId: string; flagIds?: string[]; extraEffects?: RewardChoiceEffect[] };
      }
    ): ReserveOpportunityVariantDefinition;
  };
  __ROUGE_OPP_STAGING: Partial<WorldNodeCatalogOpportunitiesApi> & {
    cOpportunityDefinitions?: Record<number, OpportunityNodeDefinition>;
  };
  __ROUGE_WNC_SHRINES_QUESTS: { questsB: Record<number, QuestNodeDefinition> };
  __ROUGE_WNV_PARTIAL: Pick<
    WorldNodeVariantsApi,
    | "resolveEventFollowUp"
    | "resolveOpportunityVariant"
    | "resolveCrossroadOpportunityVariant"
    | "resolveShrineOpportunityVariant"
    | "resolveReserveOpportunityVariant"
    | "resolveRelayOpportunityVariant"
    | "resolveCulminationOpportunityVariant"
  >;
  __ROUGE_WNV_HELPERS: WorldNodeVariantHelpersApi;
  ROUGE_WORLD_NODE_CATALOG_OPPORTUNITIES: WorldNodeCatalogOpportunitiesApi;
  ROUGE_WORLD_NODE_CATALOG: WorldNodeCatalogApi;
  ROUGE_WORLD_NODE_OUTCOMES: WorldNodeOutcomesApi;
  ROUGE_WORLD_NODE_ZONES: WorldNodeZonesApi;
  ROUGE_WORLD_NODE_VARIANTS: WorldNodeVariantsApi;
  __ROUGE_WORLD_NODE_ENGINE_CHOICE_STRATEGY: WorldNodeChoiceStrategyApi;
  __ROUGE_WORLD_NODE_ENGINE_RUNEFORGE: WorldNodeRuneforgeApi;
  __ROUGE_WORLD_NODE_ENGINE_OPPORTUNITY_RESOLVERS: WorldNodeOpportunityResolversApi;
  ROUGE_WORLD_NODES: WorldNodeEngineApi;
  ROUGE_CHARM_DATA: CharmDataApi;
  ROUGE_CHARM_SYSTEM: CharmSystemApi;
  ROUGE_HORADRIC_CUBE: HoradricCubeApi;
  ROUGE_CLASS_UNLOCK_RULES: ClassUnlockRulesApi;
  ROUGE_TOWN_SERVICES: TownServiceApi;
  ROUGE_RENDER_UTILS: RenderUtilsApi;
  ROUGE_RUN_STATE: RunStateHelpersApi;
  ROUGE_RUN_ROUTE_BUILDER: RunRouteBuilderApi;
  __ROUGE_RUN_PROGRESSION_HELPERS: RunProgressionHelpersApi;
  ROUGE_RUN_PROGRESSION: RunProgressionApi;
  ROUGE_RUN_REWARD_FLOW: RunRewardFlowApi;
  ROUGE_RUN_FACTORY: RunFactoryApi;
  ROUGE_SAVE_MIGRATIONS: SaveMigrationApi;
  ROUGE_PROFILE_MIGRATIONS: ProfileMigrationApi;
  ROUGE_PERSISTENCE: PersistenceApi;
  ROUGE_APP_ENGINE: AppEngineApi;
  __ROUGE_APP_ENGINE_RUN: AppEngineRunApi;
  ROUGE_UI_ACCOUNT_META: UiAccountMetaApi;
  ROUGE_UI_COMMON: UiCommonApi;
  ROUGE_FRONT_DOOR_EXPEDITION_VIEW: FrontDoorExpeditionViewApi;
  __ROUGE_EXPEDITION_DECISION: ExpeditionDecisionApi;
  __ROUGE_HALL_VIEW_SECTIONS: HallViewSectionsApi;
  __ROUGE_HALL_VIEW_SECTIONS_VAULT: HallViewSectionsVaultApi;
  __ROUGE_HALL_VIEW_ARCHIVE: HallViewArchiveApi;
  ROUGE_FRONT_DOOR_HALL_VIEW: FrontDoorHallViewApi;
  __ROUGE_SAFE_ZONE_OPS_MARKUP: SafeZoneOpsMarkupApi;
  ROUGE_SAFE_ZONE_OPERATIONS_VIEW: SafeZoneOperationsViewApi;
  __ROUGE_REWARD_VIEW_CONTINUITY: RewardViewContinuityApi;
  __ROUGE_ACCOUNT_META_DRILLDOWN: AccountMetaDrilldownInternalApi;
  __ROUGE_ASSET_MAP_DATA: AssetMapDataApi;
  __ROUGE_UNIQUE_ART_MANIFEST: {
    enemies: string[];
    bosses: string[];
    portraits: string[];
    mercenaries: string[];
    items?: string[];
    enemyVariants?: Record<string, string[]>;
    bossVariants?: Record<string, string[]>;
    portraitVariants?: Record<string, string[]>;
    mercenaryVariants?: Record<string, string[]>;
    itemVariants?: Record<string, string[]>;
  };
  ROUGE_ASSET_MAP: AssetMapApi;
  __ROUGE_COMBAT_BG: { getCombatBackground(zoneTitle: string): string };
  ROUGE_FRONT_DOOR_VIEW: UiPhaseViewApi;
  __ROUGE_CHARACTER_SELECT_VIEW_DETAILS: CharacterSelectViewDetailsApi;
  ROUGE_CHARACTER_SELECT_VIEW: UiPhaseViewApi;
  ROUGE_INVENTORY_VIEW: InventoryViewApi;
  ROUGE_TRAINING_VIEW: TrainingViewApi;
  __ROUGE_SAFE_ZONE_VIEW_MERCHANT_PRESENTATION: SafeZoneViewMerchantPresentationApi;
  __ROUGE_SAFE_ZONE_VIEW_MERCHANT: SafeZoneViewMerchantApi;
  ROUGE_SAFE_ZONE_VIEW: UiPhaseViewApi;
  ROUGE_WORLD_MAP_VIEW: UiPhaseViewApi;
  ROUGE_ACT_GUIDE_VIEW: ActGuideViewApi;
  __ROUGE_CHARACTER_SELECT_GUIDE: ClassSelectorGuideApi;
  __ROUGE_CHARACTER_SELECT_VIEW_DETAILS: {
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
  };
  __ROUGE_COMBAT_VIEW_EXPLORATION: {
    getCardElement(card: CardDefinition): string;
    ELEMENT_LABELS: Record<string, string>;
    renderExploration(root: HTMLElement, appState: AppState, services: UiRenderServices): void;
  };
  ROUGE_COMBAT_VIEW: UiPhaseViewApi;
  ROUGE_REWARD_VIEW: UiPhaseViewApi;
  ROUGE_ACT_TRANSITION_VIEW: UiPhaseViewApi;
  ROUGE_RUN_SUMMARY_VIEW: UiPhaseViewApi;
  ROUGE_VIEW_LIFECYCLE: ViewLifecycleApi;
  ROUGE_APP_SHELL: AppShellApi;
  __ROUGE_ACTION_DISPATCHER_COMBAT_FX: ActionDispatcherCombatFxApi;
  __ROUGE_ACTION_DISPATCHER_REWARD_FX: ActionDispatcherRewardFxApi;
  __ROUGE_ACTION_DISPATCHER_KEYBOARD: ActionDispatcherKeyboardApi;
  ROUGE_ACTION_DISPATCHER: ActionDispatcherApi;
}
