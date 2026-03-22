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
}

interface InventoryViewApi {
  buildInventoryMarkup(appState: AppState, services: UiRenderServices): string;
}

interface SafeZoneOperationsViewApi {
  createOperationsModel(appState: AppState, services: UiRenderServices): SafeZoneOperationsModel;
  buildOperationsMarkup(appState: AppState, services: UiRenderServices, model?: SafeZoneOperationsModel): string;
}

interface AppShellRenderConfig {
  appState: AppState | null;
  baseContent: GameContent;
  bootState: BootState;
}

interface ViewLifecycleApi {
  managedTimeout(fn: () => void, delay: number): ReturnType<typeof setTimeout>;
  managedRAF(fn: FrameRequestCallback): number;
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

interface ActionDispatcherCombatFxApi {
  doCombatAction(combat: CombatState, action: () => void, syncAndRender: () => void): void;
  addTempClass(el: HTMLElement, cls: string, durationMs: number): void;
}

interface ActionDispatcherRewardFxApi {
  spawnRewardParticles(sourceEl: HTMLElement): void;
}

interface ActionDispatcherApi {
  handleClick(config: ActionDispatcherConfig): boolean;
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
}

interface Window {
  ROUGE_UTILS: RougeUtilsApi;
  ROUGE_LIMITS: RougeLimits;
  ROUGE_CONSTANTS: RougeConstants;
  ROUGE_GAME_CONTENT: GameContent;
  ROUGE_DEBUG: DebugModeConfig | null;
  ROUGE_COMBAT_ENGINE: CombatEngineApi;
  ROUGE_COMBAT_MODIFIERS: CombatModifiersApi;
  ROUGE_SEED_LOADER: SeedLoaderApi;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  ROUGE_ENCOUNTER_REGISTRY_MONSTER_FAMILIES: Record<string, any>;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  ROUGE_ENCOUNTER_REGISTRY_ENEMY_BUILDERS_DATA: Record<string, any>;
  ROUGE_ENCOUNTER_REGISTRY_ENEMY_BUILDERS: EncounterRegistryEnemyBuildersApi;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  ROUGE_ENCOUNTER_REGISTRY_BUILDERS_BOSS: Record<string, any>;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  ROUGE_ENCOUNTER_REGISTRY_BUILDERS_ZONES: Record<string, any>;
  ROUGE_ENCOUNTER_REGISTRY_BUILDERS: EncounterRegistryBuildersApi;
  ROUGE_CONTENT_VALIDATOR_WORLD_PATHS: ContentValidatorWorldPathsApi;
  ROUGE_CONTENT_VALIDATOR_WORLD_OPPORTUNITIES: ContentValidatorWorldOpportunitiesApi;
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
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  __ROUGE_CV_RUNTIME_MERCENARIES: Record<string, any>;
  ROUGE_CONTENT_VALIDATOR_RUNTIME_CONTENT: ContentValidatorRuntimeContentApi;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  __ROUGE_CV_WORLD_CATALOG_SECTIONS: Record<string, any>;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  __ROUGE_CV_WORLD_CATALOG: Record<string, any>;
  ROUGE_CONTENT_VALIDATOR: ContentValidatorApi;
  ROUGE_ENCOUNTER_REGISTRY: EncounterRegistryApi;
  ROUGE_CLASS_REGISTRY: ClassRegistryApi;
  ROUGE_ITEM_DATA: ItemDataApi;
  ROUGE_ITEM_CATALOG: ItemCatalogApi;
  ROUGE_ITEM_LOADOUT: ItemLoadoutApi;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  __ROUGE_GC_MERCENARIES_LATE: Record<string, any>;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  __ROUGE_GC_MERCENARIES: Record<string, any>;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  __ROUGE_GC_ENCOUNTERS_LATE: Record<string, any>;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  __ROUGE_GC_ENCOUNTERS: Record<string, any>;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  __ROUGE_GC_REWARDS_LATE_B: Record<string, any>;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  __ROUGE_GC_REWARDS_LATE: Record<string, any>;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  __ROUGE_GC_REWARDS: Record<string, any>;
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
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  __ROUGE_WNC_QUESTS: Record<string, any>;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  __ROUGE_WNC_SHRINES: Record<string, any>;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  __ROUGE_WNC_OPPS_A: Record<string, any>;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  __ROUGE_WNC_OPPS_B: Record<string, any>;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  __ROUGE_PERSISTENCE_CORE: Record<string, any>;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  __ROUGE_PERSISTENCE_CORE_DATA: Record<string, any>;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  __ROUGE_PERSISTENCE_PLANNING: Record<string, any>;
  __ROUGE_PERSISTENCE_SUMMARIES: PersistenceSummariesApi;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  __ROUGE_PROFILE_MIGRATIONS_DATA: Record<string, any>;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  __ROUGE_MONSTER_TRAITS: Record<string, any>;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  __ROUGE_COMBAT_MONSTER_ACTIONS: Record<string, any>;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  __ROUGE_COMBAT_MERCENARY: Record<string, any>;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  __ROUGE_COMBAT_ENGINE_TURNS: Record<string, any>;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  __ROUGE_CARD_EFFECTS: Record<string, any>;
  __ROUGE_APPROACH_BONUS: {
    pickBonus(approach: string, seed: number): { id: string; label: string };
    applyBonus(combat: CombatState, bonusId: string): void;
  };
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  __ROUGE_EXPLORATION_EVENT_TEMPLATES: Record<string, any>;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  __ROUGE_REWARD_ENGINE_PROGRESSION: Record<string, any>;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  __ROUGE_APP_ENGINE_RUN: Record<string, any>;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  __ROUGE_APP_ENGINE_PROFILE: Record<string, any>;
  __ROUGE_ITEM_DATA_ACCESSORIES: Record<string, ItemTemplateDefinition>;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  __ROUGE_ITEM_DATA_RUNES: Record<string, any>;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  __ROUGE_ITEM_LOADOUT_OPS: Record<string, any>;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  __ROUGE_ITEM_TOWN_PRICING: Record<string, any>;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  __ROUGE_ITEM_TOWN_PRICING_FEES: Record<string, any>;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  __ROUGE_ITEM_TOWN_VENDOR_OFFERS: Record<string, any>;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  __ROUGE_ITEM_TOWN_VENDOR: Record<string, any>;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  __ROUGE_ITEM_TOWN_ACTIONS: Record<string, any>;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  __ROUGE_ITEM_TOWN_DECK_SERVICES: Record<string, any>;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  __ROUGE_SKILL_EVOLUTION: Record<string, any>;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  __ROUGE_ITEM_SYSTEM_REWARDS: Record<string, any>;
  ROUGE_ITEM_TOWN: ItemTownApi;
  ROUGE_ITEM_SYSTEM: ItemSystemApi;
  ROUGE_REWARD_ENGINE: RewardEngineApi;
  ROUGE_EXPLORATION_EVENTS: ExplorationEventsApi;
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
  ROUGE_WORLD_NODES: WorldNodeEngineApi;
  ROUGE_CHARM_DATA: CharmDataApi;
  ROUGE_CHARM_SYSTEM: CharmSystemApi;
  ROUGE_HORADRIC_CUBE: HoradricCubeApi;
  ROUGE_CLASS_UNLOCK_RULES: ClassUnlockRulesApi;
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
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  __ROUGE_ASSET_MAP_DATA: Record<string, any>;
  ROUGE_ASSET_MAP: AssetMapApi;
  __ROUGE_COMBAT_BG: { getCombatBackground(zoneTitle: string): string };
  ROUGE_FRONT_DOOR_VIEW: UiPhaseViewApi;
  ROUGE_CHARACTER_SELECT_VIEW: UiPhaseViewApi;
  ROUGE_INVENTORY_VIEW: InventoryViewApi;
  ROUGE_SAFE_ZONE_VIEW: UiPhaseViewApi;
  ROUGE_WORLD_MAP_VIEW: UiPhaseViewApi;
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
  ROUGE_ACTION_DISPATCHER: ActionDispatcherApi;
}
