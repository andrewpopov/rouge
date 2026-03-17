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
    weaponFamily?: string;
    weaponDamageBonus?: number;
    classPreferredFamilies?: string[];
  }): CombatState;
  playCard(state: CombatState, content: GameContent, instanceId: string, targetId?: string): ActionResult;
  endTurn(state: CombatState): ActionResult;
  usePotion(state: CombatState, targetId: "hero" | "mercenary"): ActionResult;
  meleeStrike(state: CombatState, content: GameContent): ActionResult;
  describeIntent(intent: EnemyIntent | null): string;
  getLivingEnemies(state: CombatState): CombatEnemyState[];
  getFirstLivingEnemyId(state: CombatState): string;
}

interface CombatModifiersApi {
  applyEncounterModifiers(state: CombatState): void;
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

interface EncounterRegistryZoneContent {
  enemyCatalog: Record<string, EnemyTemplate>;
  encounterCatalog: Record<string, EncounterDefinition>;
  encounterIds: string[];
}

interface EncounterRegistryBuildersApi {
  normalizeActPool(seedBundle: SeedBundle, actNumber: number): EnemyPoolEntryRef[];
  groupByRole(entries: EnemyPoolEntryRef[]): EncounterRegistryGroupedEntries;
  buildActEncounterSet(options: {
    actSeed: ActSeed;
    bossEntry: BossEntry | null | undefined;
    groupedEntries: EncounterRegistryGroupedEntries;
  }): EncounterRegistryActContent;
  buildZoneEncounterSet(options: {
    actNumber: number;
    zoneName: string;
    monsterNames: string[];
  }): EncounterRegistryZoneContent | null;
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

interface ContentValidatorRuntimeContentApi {
  validateRuntimeContent(content: GameContent): ContentValidationReport;
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

interface ItemDataApi {
  ITEM_TEMPLATES: Record<string, ItemTemplateDefinition>;
  RUNE_TEMPLATES: Record<string, RuneTemplateDefinition>;
  RUNEWORD_TEMPLATES: Record<string, RunewordTemplateDefinition>;
  RUNE_REWARD_POOLS: Record<string, string[]>;
}

interface ItemCatalogApi {
  clamp(value: number, min: number, max: number): number;
  uniquePush(list: string[], value: string): void;
  toNumber(value: unknown, fallback?: number): number;
  createRuntimeContent(baseContent: GameContent, seedBundle: SeedBundle): GameContent;
  getItemDefinition(content: GameContent, itemId: string): RuntimeItemDefinition | null;
  getRuneDefinition(content: GameContent, runeId: string): RuntimeRuneDefinition | null;
  getRunewordDefinition(content: GameContent, runewordId: string): RuntimeRunewordDefinition | null;
  isRunewordCompatibleWithItem(
    item: RuntimeItemDefinition | null | undefined,
    runeword: RuntimeRunewordDefinition | null | undefined
  ): boolean;
  isRunewordCompatibleWithEquipment(
    equipment: RunEquipmentState | null | undefined,
    runeword: RuntimeRunewordDefinition | null | undefined,
    content: GameContent
  ): boolean;
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
    content: GameContent,
    preferredRunewordId?: string
  ): RuntimeRunewordDefinition | null;
  getRuneRewardPool(slot: "weapon" | "armor"): string[];
  getWeaponFamily(itemId: string, content: GameContent): string;
  rollItemRarity(zoneKind: string, randomFn: RandomFn): string;
  generateRarityBonuses(itemDef: RuntimeItemDefinition | null, rarity: string, randomFn: RandomFn): ItemBonusSet;
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
  buildBareEquipment(equipment: RunEquipmentState, content: GameContent): RunEquipmentState | null;
  getPreservedSlotProgression(
    currentEquipment: RunEquipmentState | null | undefined,
    nextItemId: string,
    content: GameContent
  ): { socketsUnlocked: number; insertedRunes: string[] };
  addEquipmentToInventory(run: RunState, itemId: string, content: GameContent, rarity?: string, rarityBonuses?: ItemBonusSet): InventoryEquipmentEntry | null;
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

interface ItemTownApi {
  getAccountEconomyFeatures(profile?: ProfileState | null): AccountEconomyFeatures;
  getPlannedRunewordId(profile: ProfileState | null | undefined, slot: "weapon" | "armor", content?: GameContent | null): string;
  getPlannedRunewordArchiveState(
    profile: ProfileState | null | undefined,
    slot: "weapon" | "armor",
    content?: GameContent | null
  ): { runewordId: string; archivedRunCount: number; completedRunCount: number; bestActsCleared: number; unfulfilled: boolean };
  getEntryBuyPrice(entry: InventoryEntry, content: GameContent, profile?: ProfileState | null): number;
  getEntrySellPrice(entry: InventoryEntry, content: GameContent, profile?: ProfileState | null): number;
  getVendorRefreshCost(run: RunState, profile?: ProfileState | null, content?: GameContent | null): number;
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

interface TownServiceApi {
  listActions(content: GameContent, run: RunState, profile: ProfileState): TownAction[];
  applyAction(run: RunState, profile: ProfileState, content: GameContent, actionId: string): ActionResult;
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
  selectClass(state: AppState, classId: string): void;
  selectMercenary(state: AppState, mercenaryId: string): void;
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
  selectZone(state: AppState, zoneId: string): ActionResult;
  debugSkipEncounter(state: AppState): ActionResult;
  syncEncounterOutcome(state: AppState): ActionResult;
  claimRewardAndAdvance(state: AppState, choiceId?: string): ActionResult;
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
  getEnemyIcon(templateId: string): string;
  getEnemySprite(templateId: string): string | null;
  getClassPortrait(classId: string): string | null;
  getClassSprite(classId: string): string | null;
  getMercenarySprite(role: string): string | null;
  getUiIcon(key: string): string | null;
  getIntentIcon(intentDescription: string): string;
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
    hallExpanded: boolean;
    hallSection: string;
    townFocus: string;
    exploring: boolean;
    explorationEvent: ExplorationEvent | null;
    scrollMapOpen: boolean;
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
