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

interface SafeZoneOperationsViewApi {
  createOperationsModel(appState: AppState, services: UiRenderServices): SafeZoneOperationsModel;
  buildOperationsMarkup(appState: AppState, services: UiRenderServices, model?: SafeZoneOperationsModel): string;
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

interface Window {
  ROUGE_GAME_CONTENT: GameContent;
  ROUGE_COMBAT_ENGINE: CombatEngineApi;
  ROUGE_COMBAT_MODIFIERS: CombatModifiersApi;
  ROUGE_SEED_LOADER: SeedLoaderApi;
  ROUGE_ENCOUNTER_REGISTRY_ENEMY_BUILDERS: EncounterRegistryEnemyBuildersApi;
  ROUGE_ENCOUNTER_REGISTRY_BUILDERS: EncounterRegistryBuildersApi;
  ROUGE_CONTENT_VALIDATOR_WORLD_PATHS: ContentValidatorWorldPathsApi;
  ROUGE_CONTENT_VALIDATOR_WORLD_OPPORTUNITIES: ContentValidatorWorldOpportunitiesApi;
  ROUGE_CONTENT_VALIDATOR_RUNTIME_CONTENT: ContentValidatorRuntimeContentApi;
  ROUGE_CONTENT_VALIDATOR: ContentValidatorApi;
  ROUGE_ENCOUNTER_REGISTRY: EncounterRegistryApi;
  ROUGE_CLASS_REGISTRY: ClassRegistryApi;
  ROUGE_ITEM_DATA: ItemDataApi;
  ROUGE_ITEM_CATALOG: ItemCatalogApi;
  ROUGE_ITEM_LOADOUT: ItemLoadoutApi;
  ROUGE_ITEM_TOWN: ItemTownApi;
  ROUGE_ITEM_SYSTEM: ItemSystemApi;
  ROUGE_REWARD_ENGINE: RewardEngineApi;
  ROUGE_EXPLORATION_EVENTS: ExplorationEventsApi;
  ROUGE_WORLD_NODE_CATALOG_OPPORTUNITIES: WorldNodeCatalogOpportunitiesApi;
  ROUGE_WORLD_NODE_CATALOG: WorldNodeCatalogApi;
  ROUGE_WORLD_NODE_OUTCOMES: WorldNodeOutcomesApi;
  ROUGE_WORLD_NODE_ZONES: WorldNodeZonesApi;
  ROUGE_WORLD_NODE_VARIANTS: WorldNodeVariantsApi;
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
  ROUGE_UI_ACCOUNT_META: UiAccountMetaApi;
  ROUGE_UI_COMMON: UiCommonApi;
  ROUGE_FRONT_DOOR_EXPEDITION_VIEW: FrontDoorExpeditionViewApi;
  ROUGE_SAFE_ZONE_OPERATIONS_VIEW: SafeZoneOperationsViewApi;
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
