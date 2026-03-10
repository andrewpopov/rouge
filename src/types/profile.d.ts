interface DebugModeConfig {
  enabled: boolean;
  skipBattles: boolean;
  invulnerable: boolean;
  oneHitKill: boolean;
  infiniteGold: boolean;
}

interface ProfileMetaSettings {
  showHints: boolean;
  reduceMotion: boolean;
  compactMode: boolean;
  debugMode: DebugModeConfig;
}

interface ProfileSettingsPatch {
  showHints?: boolean;
  reduceMotion?: boolean;
  compactMode?: boolean;
  debugMode?: Partial<DebugModeConfig>;
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

interface ProfileMetaPlanningState {
  weaponRunewordId: string;
  armorRunewordId: string;
}

interface ProfileMetaAccountProgressionState {
  focusedTreeId: string;
}

interface ProfileMetaState {
  settings: ProfileMetaSettings;
  progression: ProfileMetaProgression;
  unlocks: ProfileMetaUnlockState;
  tutorials: ProfileMetaTutorialState;
  planning: ProfileMetaPlanningState;
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
  planningCompletionCount: number;
  planningMissCount: number;
  recentFeatureIds: string[];
  recentPlannedRunewordIds: string[];
}

interface ProfileAccountReviewSummary {
  capstoneCount: number;
  unlockedCapstoneCount: number;
  blockedCapstoneCount: number;
  readyCapstoneCount: number;
  nextCapstoneId: string;
  nextCapstoneTitle: string;
  convergenceCount: number;
  unlockedConvergenceCount: number;
  blockedConvergenceCount: number;
  availableConvergenceCount: number;
  nextConvergenceId: string;
  nextConvergenceTitle: string;
}

interface ProfileAccountConvergenceSummary {
  id: string;
  title: string;
  description: string;
  rewardFeatureId: string;
  effectSummary: string;
  status: "locked" | "available" | "unlocked";
  unlocked: boolean;
  unlockedRequirementCount: number;
  requiredFeatureCount: number;
  requiredFeatureIds: string[];
  requiredFeatureTitles: string[];
  missingFeatureIds: string[];
  missingFeatureTitles: string[];
}

interface ProfilePlanningCharterSummary {
  slot: "weapon" | "armor";
  runewordId: string;
  archivedRunCount: number;
  completedRunCount: number;
  bestActsCleared: number;
  bestCompletedRunId: string;
  bestCompletedClassId: string;
  bestCompletedClassName: string;
  bestCompletedAt: string;
  bestCompletedLoadoutTier: number;
  bestCompletedLoadoutSockets: number;
  requiredSocketCount: number;
  compatibleBaseCount: number;
  preparedBaseCount: number;
  readyBaseCount: number;
  bestBaseItemId: string;
  bestBaseTier: number;
  bestBaseSocketsUnlocked: number;
  bestBaseMaxSockets: number;
  bestBaseInsertedRuneCount: number;
  bestBaseMissingRuneCount: number;
  bestBaseSocketGap: number;
  commissionableBaseCount: number;
  hasReadyBase: boolean;
  repeatForgeReady: boolean;
}

interface ProfilePlanningOverviewSummary {
  compatibleCharterCount: number;
  preparedCharterCount: number;
  readyCharterCount: number;
  missingBaseCharterCount: number;
  socketCommissionCharterCount: number;
  repeatForgeReadyCharterCount: number;
  trackedBaseCount: number;
  highestTrackedBaseTier: number;
  totalSocketStepsRemaining: number;
  compatibleRunewordIds: string[];
  preparedRunewordIds: string[];
  readyRunewordIds: string[];
  missingBaseRunewordIds: string[];
  fulfilledRunewordIds: string[];
  bestFulfilledActsCleared: number;
  bestFulfilledLoadoutTier: number;
  nextAction: "idle" | "stock_runes" | "open_sockets" | "prepare_bases" | "hunt_bases";
  nextActionLabel: string;
  nextActionSummary: string;
}

interface ProfilePlanningSummary {
  weaponRunewordId: string;
  armorRunewordId: string;
  plannedRunewordCount: number;
  fulfilledPlanCount: number;
  unfulfilledPlanCount: number;
  weaponArchivedRunCount: number;
  weaponCompletedRunCount: number;
  weaponBestActsCleared: number;
  armorArchivedRunCount: number;
  armorCompletedRunCount: number;
  armorBestActsCleared: number;
  overview: ProfilePlanningOverviewSummary;
  weaponCharter?: ProfilePlanningCharterSummary;
  armorCharter?: ProfilePlanningCharterSummary;
}

interface ProfileAccountSummary {
  profile: ProfileSummary;
  settings: ProfileMetaSettings;
  unlockedFeatureIds: string[];
  activeTutorialIds: string[];
  dismissedTutorialCount: number;
  planning: ProfilePlanningSummary;
  stash: ProfileStashSummary;
  archive: ProfileArchiveSummary;
  review: ProfileAccountReviewSummary;
  convergences: ProfileAccountConvergenceSummary[];
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
