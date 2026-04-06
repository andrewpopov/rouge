type TrainingViewSource = "" | "safe_zone" | "act_transition";
type TrainingViewMode = "browse" | "unlock" | "equip" | "swap";
type TrainingSkillStateId = "starter" | "equipped" | "unlocked" | "eligible" | "locked";

interface TrainingViewState {
  open: boolean;
  source: TrainingViewSource;
  selectedTreeId: string;
  selectedSkillId: string;
  compareSkillId: string;
  selectedSlot: "" | RunSkillBarSlotKey;
  mode: TrainingViewMode;
}

interface TrainingSlotViewModel {
  slotKey: RunSkillBarSlotKey;
  slotNumber: 1 | 2 | 3;
  roleLabel: string;
  unlocked: boolean;
  statusLabel: string;
  gateLabel: string;
  equippedSkillId: string;
  equippedSkillName: string;
  family: SkillFamilyId | "";
  cost: number;
  cooldown: number;
  shortRuleText: string;
}

interface TrainingSkillViewModel {
  skillId: string;
  treeId: string;
  treeName: string;
  name: string;
  family: SkillFamilyId;
  slot: ClassSkillSlotNumber;
  tier: ClassSkillTier;
  requiredLevel: number;
  cost: number;
  cooldown: number;
  summary: string;
  exactText: string;
  state: TrainingSkillStateId;
  gateLabel: string;
  isStarter: boolean;
  oncePerBattle: boolean;
  chargeCount: number;
}

interface TrainingTreeViewModel {
  treeId: string;
  treeName: string;
  rank: number;
  maxRank: number;
  favoredForCapstone: boolean;
  bridgeReady: boolean;
  capstoneReady: boolean;
  commitmentBadgeLabels: string[];
  nextMilestoneLabel: string;
  skills: TrainingSkillViewModel[];
}

interface TrainingScreenModel {
  classId: string;
  className: string;
  level: number;
  mode: TrainingViewMode;
  favoredTreeId: string;
  skillPointsAvailable: number;
  classPointsAvailable: number;
  attributePointsAvailable: number;
  slotStateLabel: string;
  nextSlotGateLabel: string;
  selectedTreeId: string;
  selectedSkillId: string;
  compareSkillId: string;
  selectedSlot: "" | RunSkillBarSlotKey;
  slots: TrainingSlotViewModel[];
  trees: TrainingTreeViewModel[];
  selectedSkill: TrainingSkillViewModel | null;
  compareSkill: TrainingSkillViewModel | null;
  progressionActions: TownAction[];
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
    characterSelectTab: "overview" | "kit" | "playstyle" | "paths";
    reviewedHistoryIndex: number;
    confirmAbandonSavedRun: boolean;
    hallExpanded: boolean;
    hallSection: string;
    spellbookOpen: boolean;
    townFocus: string;
    townOverviewTab: "departure" | "loadout" | "services" | "account" | "districts" | "debug";
    inventoryOpen: boolean;
    inventoryTab: string;
    inventoryDetailEntryId: string;
    exploring: boolean;
    explorationEvent: ExplorationEvent | null;
    combatPileView: "" | "draw" | "discard" | "decklist";
    combatLogOpen: boolean;
    scrollMapOpen: boolean;
    routeIntelOpen: boolean;
    actTransitionScrollOpen: boolean;
    trainingView: TrainingViewState;
    runSummaryStep: "finale" | "ledger" | "archive";
    runSummaryStepDirection: "none" | "forward" | "backward";
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
