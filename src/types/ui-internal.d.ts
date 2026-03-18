interface ExpeditionDecisionApi {
  buildHallNavigatorMarkup(appState: AppState, services: UiRenderServices, savedRunSummary: SavedRunSummary | null, accountSummary: ProfileAccountSummary): string;
  buildHallDecisionSupportMarkup(appState: AppState, services: UiRenderServices, savedRunSummary: SavedRunSummary | null, accountSummary: ProfileAccountSummary): string;
}

interface ArchiveReviewState {
  historyEntries: RunHistoryEntry[];
  reviewedHistoryIndex: number;
  reviewedHistoryEntry: RunHistoryEntry | null;
  reviewedRunewordLabels: string[];
  reviewedPlannedRunewordLabels: string[];
  reviewedCompletedPlannedRunewordLabels: string[];
  reviewedFeatureLabels: string[];
  reviewedFavoredTreeLabel: string;
  runHistoryCapacity: number;
}

interface HallViewSectionsApi {
  formatTimestamp(timestamp: string, includeYear?: boolean): string;
  getRunOutcomeTone(outcome: RunHistoryEntry["outcome"]): string;
  getSettingLabel(enabled: boolean, positiveLabel: string, negativeLabel: string): string;
  getLabelFromId(id: string): string;
  getClassName(appState: AppState, classId: string): string;
  getItemLabel(appState: AppState, itemId: string): string;
  getRuneLabel(appState: AppState, runeId: string): string;
  getRunewordLabel(appState: AppState, runewordId: string): string;
  getArchiveReviewState(appState: AppState, accountSummary: ProfileAccountSummary): ArchiveReviewState;
  getCapstoneTone(status: ProfileAccountTreeSummary["capstoneStatus"] | ""): string;
  getCapstoneReviewTone(review: { readyCapstoneCount: number; unlockedCapstoneCount: number; capstoneCount: number }): string;
  getVaultForecast(planning: ProfilePlanningSummary): { tone: string; copy: string };
  getTreeCapstoneBadgeLabel(tree: ProfileAccountTreeSummary): string;
  buildAccountOverviewMarkup(appState: AppState, services: UiRenderServices, savedRunSummary: SavedRunSummary | null, phaseTone: string, accountSummary: ProfileAccountSummary): string;
  buildAccountDashboardMarkup(appState: AppState, services: UiRenderServices, savedRunSummary: SavedRunSummary | null, phaseTone: string, accountSummary: ProfileAccountSummary): string;
  buildUnlockGalleryMarkup?: (appState: AppState, services: UiRenderServices, accountSummary: ProfileAccountSummary) => string;
  buildVaultLogisticsMarkup?: (appState: AppState, services: UiRenderServices, accountSummary: ProfileAccountSummary) => string;
}

interface HallViewSectionsVaultApi {
  buildUnlockGalleryMarkup(appState: AppState, services: UiRenderServices, accountSummary: ProfileAccountSummary): string;
  buildVaultLogisticsMarkup(appState: AppState, services: UiRenderServices, accountSummary: ProfileAccountSummary): string;
}

interface HallViewArchiveApi {
  buildArchiveDeskMarkup(appState: AppState, services: UiRenderServices, accountSummary: ProfileAccountSummary): string;
  buildArchiveSignalBoardMarkup(appState: AppState, services: UiRenderServices, accountSummary: ProfileAccountSummary): string;
  buildVaultChronicleMarkup(appState: AppState, services: UiRenderServices, accountSummary: ProfileAccountSummary, stashPreviewLines: string[], recentRunMarkup: string): string;
  buildCapstoneWatchMarkup(services: UiRenderServices, accountSummary: ProfileAccountSummary): string;
}

interface SafeZoneOpsMarkupApi {
  buildPrepComparisonMarkup(model: SafeZoneOperationsModel, appState: AppState, services: UiRenderServices): string;
  buildWorldLedgerMarkup(run: RunState, renderUtils: RenderUtilsApi): string;
  buildDepartureBriefingMarkup(run: RunState, routeSnapshot: SafeZoneSnapshot, derivedParty: DerivedPartyState, worldOutcomeCount: number, renderUtils: RenderUtilsApi): string;
  buildLoadoutBenchMarkup(run: RunState, content: GameContent, renderUtils: RenderUtilsApi): string;
}

interface RewardViewContinuityApi {
  buildRewardContinuityMarkup(appState: AppState, services: UiRenderServices, run: RunState, reward: RunReward, derivedParty: DerivedPartyState, trainingRanks: number): string;
  buildChoiceMutationLines(choice: RewardChoice, reward: RunReward, run: RunState, content: GameContent): string[];
  buildChoiceDeltaMarkup(choices: RewardChoice[], reward: RunReward, run: RunState, content: GameContent, renderUtils: RenderUtilsApi): string;
}

interface AccountMetaDrilldownInternalApi {
  buildAccountMetaDrilldownMarkup(appState: AppState, accountSummary: ProfileAccountSummary, renderUtils: RenderUtilsApi, options?: AccountMetaDrilldownOptions): string;
  buildAccountTreeReviewMarkup(accountSummary: ProfileAccountSummary, renderUtils: RenderUtilsApi, options?: AccountTreeReviewOptions): string;
}

interface AppEngineRunApi {
  PHASES: Record<string, string>;
  getPersistence(): PersistenceApi | null;
  createFallbackProfile(): ProfileState;
  syncProfileMetaSelection(profile: ProfileState, classId: string): void;
  loadProfile(): ProfileState;
  persistProfile(profile: ProfileState): void;
  clearActiveRunProfile(profile: ProfileState): void;
  recordRunHistory(profile: ProfileState, entry: RunHistoryEntry): void;
  recordSnapshotRunHistory(profile: ProfileState, run: RunState, outcome: string): void;
  getTrainingRankCount(run: RunState): number;
  parseInteger(value: unknown, fallback?: number): number;
  buildMercenaryRouteCombatBonuses(run: RunState): CombatBonusSet;
  getPhaseLabel(phase: string): string;
  resetFrontDoorUi(appState: AppState): void;
  clampRunHistoryReviewIndex(appState: AppState): void;
  getPreferredClassId(profile: ProfileState): string;
  createRunSnapshot(run: RunState): unknown;
  persistRunIfPossible(appState: AppState): void;
  restoreSnapshotIntoState(appState: AppState, snapshot: unknown): RunState | null;
}

interface RougeUtilsApi {
  clamp(value: number, min: number, max: number): number;
  deepClone<T>(value: T): T;
  toNumber(value: unknown, fallback?: number): number;
  uniquePush(list: string[], value: string | undefined | null): void;
  uniqueStrings(values: unknown): string[];
  slugify(value: unknown): string;
  parseInteger(value: unknown, fallback: number): number;
  isObject(value: unknown): value is Record<string, unknown>;
  hasTownFeature(profile: ProfileState | null | undefined, featureId: string): boolean;
  getFocusedAccountTreeId(profile: ProfileState | null | undefined): string;
}

interface PersistenceSummariesApi {
  getProfileSummary: (profile: ProfileState, content?: GameContent | null) => ProfileSummary;
  getAccountProgressSummary: (profile: ProfileState, content?: GameContent | null) => ProfileAccountSummary;
  buildRunHistoryEntry: (profile: ProfileState, run: RunState, outcome: string, content: GameContent, newFeatureIds?: string[]) => RunHistoryEntry;
  buildStashSummary: (profile: ProfileState) => Record<string, unknown>;
  buildArchiveSummary: (profile: ProfileState) => Record<string, unknown>;
  buildAccountReviewSummary: (milestones: unknown[], convergences?: unknown[]) => Record<string, unknown>;
  getRunHistoryLoadoutMetrics: (run: RunState, content: GameContent) => Record<string, number>;
  getProfileStashCounts: (profile: ProfileState) => Record<string, number>;
}

interface WorldNodeVariantHelpersApi {
  getWorldNodeCatalogApi(): WorldNodeCatalogApi;
  getCatalog(): WorldNodeCatalog;
  getCatalogEntry<K extends keyof WorldNodeCatalog>(key: K, actNumber: number): WorldNodeCatalog[K][number];
  matchesRequiredValue(requiredIds: string[] | null | undefined, value: string): boolean;
  includesRequiredValues(requiredIds: string[] | null | undefined, availableIds: string[]): boolean;
  getOpportunityVariantSpecificity(variantDefinition: OpportunityNodeVariantDefinition | null | undefined): number;
  getReserveOpportunityVariantSpecificity(variantDefinition: ReserveOpportunityVariantDefinition | null | undefined): number;
}
