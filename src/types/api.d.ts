/* eslint-disable max-lines */
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
    weaponName?: string;
    weaponDamageBonus?: number;
    weaponProfile?: WeaponCombatProfile | null;
    armorProfile?: ArmorMitigationProfile | null;
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

interface CombatWeaponScalingPolicy {
  preferredWeaponCardBonus: number;
  weaponSupportBaselineBonus: number;
  preferredWeaponEffectBonus: number;
  preferredWeaponMeleeBonus: number;
}

interface CombatWeaponScalingApi {
  WEAPON_SCALING_POLICY: CombatWeaponScalingPolicy;
  getCardProficiency(cardId: string): string;
  hasPreferredWeaponFamily(state: CombatState): boolean;
  getWeaponAttackBonus(state: CombatState, cardId: string): number;
  getWeaponSupportBonus(state: CombatState, cardId: string): number;
  getWeaponTypedDamageAmount(state: CombatState, entry: WeaponDamageDefinition, cardId: string): number;
  getWeaponEffectAmount(state: CombatState, effect: WeaponEffectDefinition): number;
  getMeleeDamage(state: CombatState): number;
}

interface CombatTurnsApi {
  healEntity(entity: CombatHeroState | CombatMercenaryState | CombatEnemyState, amount: number): number;
  applyGuard(entity: CombatHeroState | CombatMercenaryState | CombatEnemyState, amount: number): number;
  dealDamage(
    state: CombatState,
    entity: CombatHeroState | CombatMercenaryState | CombatEnemyState,
    amount: number,
    damageType?: DamageType
  ): number;
  dealDirectDamage(
    state: CombatState,
    entity: CombatHeroState | CombatMercenaryState | CombatEnemyState,
    amount: number,
    damageType?: DamageType
  ): number;
  checkOutcome(state: CombatState): boolean;
  getLivingEnemies(state: CombatState): CombatEnemyState[];
  getFirstLivingEnemyId(state: CombatState): string;
  appendLog(state: CombatState, message: string): void;
  drawCards(state: CombatState, count: number): number;
  discardHand(state: CombatState): void;
  getWeaponAttackBonus(state: CombatState, cardId: string): number;
  getWeaponSupportBonus(state: CombatState, cardId: string): number;
  applyWeaponTypedDamage(state: CombatState, targets: CombatEnemyState[], cardId: string): string[];
  applyWeaponEffects(state: CombatState, targets: CombatEnemyState[], cardId: string): string[];
  meleeStrike(state: CombatState, content: GameContent): ActionResult;
  startPlayerTurn(state: CombatState): void;
  endTurn(state: CombatState): ActionResult;
  usePotion(state: CombatState, targetId: "hero" | "mercenary"): ActionResult;
  resolveMercenaryAction(state: CombatState): void;
  resolveEnemyAction(state: CombatState, enemy: CombatEnemyState): void;
  advanceEnemyIntents(state: CombatState): void;
  _shuffleInPlace<T>(items: T[], randomFn: RandomFn): T[];
}

interface CombatMercenaryApi {
  chooseMercenaryTarget(state: CombatState): CombatEnemyState | null;
  resolveMercenaryAction(
    state: CombatState,
    appendLog: (state: CombatState, message: string) => void,
    dealDamage: (state: CombatState, entity: CombatHeroState | CombatMercenaryState | CombatEnemyState, amount: number) => number,
    applyGuard: (entity: CombatHeroState | CombatMercenaryState | CombatEnemyState, amount: number) => number,
    getFirstLivingEnemyId: (state: CombatState) => string,
  ): void;
}

interface CombatCardEffectsApi {
  resolveCardEffect(state: CombatState, effect: CardEffect, targetEnemy: CombatEnemyState | null, cardId: string): string;
  summarizeCardEffect(card: CardDefinition, segments: string[]): string;
}

interface IncomingPressureSummary {
  attackers: number;
  damage: number;
  tags: string[];
  lineThreat: boolean;
}

interface CombatViewPreviewApi {
  getEffectiveCardCost(
    combat: CombatState,
    content: GameContent,
    instance: { cardId: string },
    card: CardDefinition
  ): number;
  buildCardPreviewOutcome(
    combat: CombatState,
    instance: { cardId: string },
    card: CardDefinition,
    selectedEnemy: CombatEnemyState | null
  ): string;
  buildMeleePreviewOutcome(combat: CombatState, selectedEnemy: CombatEnemyState | null): string;
  derivePreviewScopes(card: CardDefinition): string[];
  describePreviewScopes(scopes: string[]): string;
  summarizePreviewOutcome(previewOutcome: string): string;
}

interface CombatViewPressureApi {
  buildEmptyPressureSummary(): IncomingPressureSummary;
  buildIncomingPressure(combat: CombatState): { hero: IncomingPressureSummary; mercenary: IncomingPressureSummary };
  buildEnemyIntentPresentation(combat: CombatState, intent: EnemyIntent | null): { targetLabel: string; intentClass: string };
  renderIncomingPressure(summary: IncomingPressureSummary, escapeHtml: (s: string) => string): string;
}

interface CombatViewRenderersApi {
  renderAllySprite(config: {
    unit: { alive: boolean; life: number; maxLife: number; guard: number; name: string };
    figureClass: string;
    portraitHtml: string;
    potionAction: string;
    potionDisabled: boolean;
    extraStatusHtml: string;
    incomingPressureHtml: string;
    threatened: boolean;
    escapeHtml: (s: string) => string;
  }): string;
  renderEnemySprite(
    combat: CombatState,
    enemy: CombatEnemyState,
    isSelected: boolean,
    isMarked: boolean,
    hasOutcome: boolean,
    intentDesc: string,
    escapeHtml: (s: string) => string
  ): string;
  renderHandCard(config: {
    instance: { instanceId: string; cardId: string };
    index: number;
    cardCount: number;
    card: CardDefinition;
    effectiveCost: number;
    previewOutcome: string;
    stateClass: string;
    stateLabel: string;
    cantPlay: boolean;
    escapeHtml: (s: string) => string;
  }): string;
  renderCombatLogPanel(combat: CombatState, escapeHtml: (s: string) => string): string;
}

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

interface CombatModifiersApi {
  INTENT: Record<string, string>;
  MODIFIER_KIND: Record<string, string>;
  ATTACK_INTENT_KINDS: Set<string>;
  HEALING_INTENT_KINDS: Set<string>;
  LINEBREAKER_INTENT_KINDS: Set<string>;
  RITUAL_INTENT_KINDS: Set<string>;
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

interface ItemDataRunesApi {
  RUNE_TEMPLATES: Record<string, RuneTemplateDefinition>;
  RUNEWORD_TEMPLATES: Record<string, RunewordTemplateDefinition>;
  RUNE_REWARD_POOLS: Record<string, string[]>;
}

interface ItemCatalogProfilesApi {
  RARITY: ItemCatalogApi["RARITY"];
  SLOT_FAMILY_DEFAULTS: Record<EquipmentSlot, string>;
  normalizeRarity(rarity: unknown, rarityKind?: unknown): string;
  getRarityKind(rarity: string | undefined): string;
  getRarityLabel(rarity: string | undefined): string;
  cloneWeaponProfile(profile: WeaponCombatProfile | null | undefined): WeaponCombatProfile | undefined;
  cloneArmorProfile(profile: ArmorMitigationProfile | null | undefined): ArmorMitigationProfile | undefined;
  buildDefaultWeaponProfile(slot: EquipmentSlot, family: string, progressionTier: number): WeaponCombatProfile | undefined;
  buildDefaultArmorProfile(slot: EquipmentSlot, progressionTier: number): ArmorMitigationProfile | undefined;
  mergeWeaponProfiles(
    baseProfile: WeaponCombatProfile | null | undefined,
    overrideProfile: WeaponCombatProfile | null | undefined
  ): WeaponCombatProfile | undefined;
  mergeArmorProfiles(
    baseProfile: ArmorMitigationProfile | null | undefined,
    overrideProfile: ArmorMitigationProfile | null | undefined
  ): ArmorMitigationProfile | undefined;
  getWeaponProfileForRarity(profile: WeaponCombatProfile | null | undefined, rarity: string | undefined): WeaponCombatProfile | undefined;
  getArmorProfileForRarity(profile: ArmorMitigationProfile | null | undefined, rarity: string | undefined): ArmorMitigationProfile | undefined;
  buildEquipmentWeaponProfile(equipment: RunEquipmentState | null | undefined, content: GameContent): WeaponCombatProfile | undefined;
  buildEquipmentArmorProfile(equipment: RunEquipmentState | null | undefined, content: GameContent): ArmorMitigationProfile | undefined;
  rollWeaponAffixes(itemDef: RuntimeItemDefinition | null, rarity: string, randomFn: RandomFn): WeaponCombatProfile | undefined;
  rollArmorAffixes(itemDef: RuntimeItemDefinition | null, rarity: string, randomFn: RandomFn): ArmorMitigationProfile | undefined;
  rollItemRarity(zoneKind: string, randomFn: RandomFn): string;
  generateRarityBonuses(itemDef: RuntimeItemDefinition | null, rarity: string, randomFn: RandomFn): ItemBonusSet;
}

interface ItemCatalogRuntimeContentApi {
  createRuntimeContent(baseContent: GameContent, seedBundle: SeedBundle | null): GameContent;
}

interface ItemCatalogApi {
  RARITY: { readonly WHITE: "white"; readonly MAGIC: "blue"; readonly RARE: "yellow"; readonly UNIQUE: "brown"; readonly SET: "green" };
  clamp(value: number, min: number, max: number): number;
  uniquePush(list: string[], value: string): void;
  toNumber(value: unknown, fallback?: number): number;
  createRuntimeContent(baseContent: GameContent, seedBundle: SeedBundle | null): GameContent;
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
  itemSlotForLoadoutKey(loadoutKey: string): string;
  isRuneAllowedInSlot(rune: RuntimeRuneDefinition | null | undefined, slot: string): boolean;
  resolveRunewordId(equipment: RunEquipmentState | null | undefined, content: GameContent): string;
  normalizeEquipmentState(
    value: unknown,
    slot: string,
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
  normalizeRarity(rarity: unknown, rarityKind?: unknown): string;
  getRarityKind(rarity: string | undefined): string;
  getRarityLabel(rarity: string | undefined): string;
  cloneWeaponProfile(profile: WeaponCombatProfile | null | undefined): WeaponCombatProfile | undefined;
  cloneArmorProfile(profile: ArmorMitigationProfile | null | undefined): ArmorMitigationProfile | undefined;
  getWeaponProfileForRarity(profile: WeaponCombatProfile | null | undefined, rarity: string | undefined): WeaponCombatProfile | undefined;
  buildEquipmentWeaponProfile(equipment: RunEquipmentState | null | undefined, content: GameContent): WeaponCombatProfile | undefined;
  getArmorProfileForRarity(profile: ArmorMitigationProfile | null | undefined, rarity: string | undefined): ArmorMitigationProfile | undefined;
  buildEquipmentArmorProfile(equipment: RunEquipmentState | null | undefined, content: GameContent): ArmorMitigationProfile | undefined;
  getRuneRewardPool(slot: "weapon" | "armor"): string[];
  getWeaponFamily(itemId: string, content: GameContent): string;
  rollItemRarity(zoneKind: string, randomFn: RandomFn): string;
  generateRarityBonuses(itemDef: RuntimeItemDefinition | null, rarity: string, randomFn: RandomFn): ItemBonusSet;
  rollWeaponAffixes(itemDef: RuntimeItemDefinition | null, rarity: string, randomFn: RandomFn): WeaponCombatProfile | undefined;
  rollArmorAffixes(itemDef: RuntimeItemDefinition | null, rarity: string, randomFn: RandomFn): ArmorMitigationProfile | undefined;
}

interface ItemLoadoutApi {
  ALL_LOADOUT_SLOTS: LoadoutSlotKey[];
  ALL_EQUIPMENT_SLOTS: EquipmentSlot[];
  INVENTORY_CAPACITY: number;
  STASH_CAPACITY: number;
  LOADOUT_SLOT_LABELS: Record<LoadoutSlotKey, string>;
  EQUIPMENT_SLOT_LABELS: Record<EquipmentSlot, string>;
  EQUIPMENT_SLOT_FAMILIES: Record<EquipmentSlot, string>;
  resolveLoadoutKey(slot: EquipmentSlot, run: RunState): LoadoutSlotKey;
  isInventoryFull(run: RunState): boolean;
  isStashFull(profile: ProfileState): boolean;
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
  addEquipmentToInventory(
    run: RunState,
    itemId: string,
    content: GameContent,
    rarity?: string,
    rarityBonuses?: ItemBonusSet,
    weaponAffixes?: WeaponCombatProfile,
    armorAffixes?: ArmorMitigationProfile
  ): InventoryEquipmentEntry | null;
  addRuneToInventory(run: RunState, runeId: string, content: GameContent): InventoryRuneEntry | null;
  findCarriedEntry(run: RunState, entryId: string): InventoryEntry | null;
  removeCarriedEntry(run: RunState, entryId: string): InventoryEntry | null;
  removeStashEntry(profile: ProfileState, entryId: string): InventoryEntry | null;
  equipInventoryEntry(run: RunState, entryId: string, content: GameContent, targetLoadoutSlot?: LoadoutSlotKey): ActionResult;
  unequipSlot(run: RunState, slot: LoadoutSlotKey, content: GameContent): ActionResult;
  socketInventoryRune(run: RunState, entryId: string, slot: LoadoutSlotKey, content: GameContent): ActionResult;
  stashCarriedEntry(run: RunState, profile: ProfileState, entryId: string): ActionResult;
  withdrawStashEntry(run: RunState, profile: ProfileState, entryId: string): ActionResult;
  getActiveRunewords(run: RunState, content: GameContent): string[];
  getLoadoutSummary(run: RunState, content: GameContent): string[];
  applyChoice(run: RunState, choice: RewardChoice, content: GameContent): ActionResult;
  buildCombatBonuses(run: RunState, content: GameContent): ItemBonusSet;
  buildCombatMitigationProfile(run: RunState, content: GameContent): ArmorMitigationProfile | undefined;
}

interface ItemTownPlanningMatch {
  runeword: RuntimeRunewordDefinition;
  slot: EquipmentSlot;
}

interface ItemTownPricingApi {
  ECONOMY_FEATURE_MAP: [keyof AccountEconomyFeatures, string][];
  getAccountEconomyFeatures(profile?: ProfileState | null): AccountEconomyFeatures;
  getPlannedRunewordId(profile: ProfileState | null | undefined, slot: string, content?: GameContent | null): string;
  getPlannedRuneword(
    profile: ProfileState | null | undefined,
    slot: string,
    content?: GameContent | null
  ): RuntimeRunewordDefinition | null;
  getPlannedRunewordTargets(profile: ProfileState | null | undefined, content?: GameContent | null): RuntimeRunewordDefinition[];
  getPlannedRunewordArchiveState(
    profile: ProfileState | null | undefined,
    slot: string,
    content?: GameContent | null
  ): { runewordId: string; archivedRunCount: number; completedRunCount: number; bestActsCleared: number; unfulfilled: boolean };
  getPlanningSummary(profile: ProfileState | null | undefined, content?: GameContent | null): ProfilePlanningSummary;
  hasOpenPlanningCharter(profile: ProfileState | null | undefined, content?: GameContent | null): boolean;
  getPlanningStageLine(slot: string, planning: ProfilePlanningSummary | null | undefined, content: GameContent): string;
  getPlanningRunewordListLabel(runewordIds: string[], content: GameContent): string;
  getTargetRunewordForEquipment(
    equipment: RunEquipmentState | null,
    run: RunState,
    content: GameContent,
    profile?: ProfileState | null
  ): RuntimeRunewordDefinition | null;
  getEntryPlanningMatch(entry: InventoryEntry | null, content: GameContent, profile?: ProfileState | null): ItemTownPlanningMatch | null;
  getEquipmentPlanningMatch(
    equipment: RunEquipmentState | null,
    content: GameContent,
    profile?: ProfileState | null
  ): ItemTownPlanningMatch | null;
  canCommissionSocket(equipment: RunEquipmentState | null, content: GameContent): boolean;
  getStashPlanningPressure(profile: ProfileState | null): { stashEntries: number; socketReadyEntries: number; runewordEntries: number };
  getEquipmentValue(equipment: RunEquipmentState | null | undefined, content: GameContent): number;
  getRuneValue(runeId: string, content: GameContent): number;
  getEntryBuyPrice(entry: InventoryEntry, content: GameContent, profile?: ProfileState | null): number;
  getEntrySellPrice(entry: InventoryEntry, content: GameContent, profile?: ProfileState | null): number;
  sellCarriedEntry(run: RunState, entryId: string, content: GameContent, profile?: ProfileState | null): ActionResult;
  getVendorRefreshCost(run: RunState, profile?: ProfileState | null, content?: GameContent | null): number;
  getVendorConsignmentFee(entry: InventoryEntry, content: GameContent, profile?: ProfileState | null): number;
  getSocketCommissionCost(
    run: RunState,
    equipment: RunEquipmentState | null,
    content: GameContent,
    profile?: ProfileState | null,
    location?: string
  ): number;
  buildSocketCommissionAction(
    run: RunState,
    equipment: RunEquipmentState | null,
    content: GameContent,
    profile: ProfileState | null,
    location: string,
    actionId: string,
    subtitle: string,
    description: string
  ): TownAction | null;
  commissionEquipmentSocket(equipment: RunEquipmentState, content: GameContent): boolean;
  addVendorEntryToProfileStash(profile: ProfileState, entry: InventoryEntry, content: GameContent): InventoryEntry | null;
  buildInventoryAction(
    entry: InventoryEntry,
    content: GameContent,
    kind: string,
    subtitle: string,
    description: string,
    previewLines: string[],
    action: { label: string; cost?: number; disabled?: boolean }
  ): TownAction;
}

interface ItemTownVendorOffersApi {
  pickUniqueDefinitions<T extends { id: string }>(
    candidates: (T | null | undefined)[],
    options: T[],
    desiredCount: number,
    seed: number
  ): T[];
  pickVendorEquipmentOffers(
    slot: "weapon" | "armor",
    run: RunState,
    currentEquipment: RunEquipmentState | null,
    options: RuntimeItemDefinition[],
    desiredCount: number,
    seed: number,
    content: GameContent,
    profile?: ProfileState | null
  ): RuntimeItemDefinition[];
  fillDefinitionSelection<T extends { id: string }>(selection: T[], options: T[], desiredCount: number): T[];
}

interface ItemTownVendorApi {
  generateVendorStock(run: RunState, content: GameContent, profile?: ProfileState | null): InventoryEntry[];
  normalizeVendorStock(run: RunState, content: GameContent, profile?: ProfileState | null): void;
}

interface ItemTownActionsApi {
  listTownActions(run: RunState, profile: ProfileState, content: GameContent): TownAction[];
  getInventorySummary(run: RunState, profile: ProfileState, content: GameContent): string[];
}

interface ItemTownDeckServicesApi {
  buildBlacksmithActions(run: RunState, content: GameContent): TownAction[];
  applyBlacksmithAction(run: RunState, content: GameContent, actionId: string): ActionResult;
  buildSageActions(run: RunState, content: GameContent): TownAction[];
  applySageAction(run: RunState, content: GameContent, actionId: string): ActionResult;
  buildGamblerActions(run: RunState): TownAction[];
  applyGamblerAction(run: RunState, content: GameContent, actionId: string): ActionResult;
}

interface ItemSystemRewardsApi {
  describeBonuses(bonuses: ItemBonusSet): string[];
  getFocusSlots(run: RunState, actNumber: number, encounterNumber: number, content: GameContent): EquipmentSlot[];
  isLateActPivotZone(zone: ZoneState | null, actNumber: number): boolean;
  getAvailableItemsForSlot(
    slot: string,
    actNumber: number,
    zone: ZoneState,
    run: RunState,
    content: GameContent
  ): RuntimeItemDefinition[];
  getPlannedRuneword(slot: string, profile: ProfileState | null, content: GameContent): RuntimeRunewordDefinition | null;
  getPlanningSummary(profile: ProfileState | null | undefined, content?: GameContent | null): ProfilePlanningSummary;
  getPlanningCharterSummary(
    profile: ProfileState | null,
    slot: string,
    content?: GameContent | null
  ): ProfilePlanningCharterSummary | null;
  getUpgradeItemForSlot(
    slot: string,
    equipment: RunEquipmentState | null,
    actNumber: number,
    zone: ZoneState,
    run: RunState,
    content: GameContent,
    profile?: ProfileState | null
  ): RuntimeItemDefinition | null;
  buildReplacementText(currentEquipment: RunEquipmentState | null, nextItem: RuntimeItemDefinition | null, content: GameContent): string;
  pickFallbackRuneId(
    slot: string,
    actNumber: number,
    encounterNumber: number,
    run: RunState,
    zone: ZoneState,
    content: GameContent
  ): string;
  shouldPrioritizeLateActReplacement(
    equipment: RunEquipmentState | null,
    upgradeItem: RuntimeItemDefinition | null,
    actNumber: number,
    zone: ZoneState,
    run: RunState,
    content: GameContent,
    profile?: ProfileState | null
  ): boolean;
}

interface ItemSystemEquipmentTableEntry {
  kind: "equipment";
  id: string;
  item: RuntimeItemDefinition;
  weight: number;
  dropRate: number;
}

interface ItemSystemRuneTableEntry {
  kind: "rune";
  id: string;
  rune: RuntimeRuneDefinition;
  weight: number;
  dropRate: number;
}

interface ItemSystemEquipmentDrop {
  kind: "equipment";
  id: string;
  tableDropRate: number;
  rarity: string;
  rarityBonuses: ItemBonusSet;
  weaponAffixes?: WeaponCombatProfile;
  armorAffixes?: ArmorMitigationProfile;
}

interface ItemSystemRuneDrop {
  kind: "rune";
  id: string;
  tableDropRate: number;
}

type ItemSystemExtraDrop = ItemSystemEquipmentDrop | ItemSystemRuneDrop;

interface ItemSystemLootApi {
  createSeededRandom(seed: number): RandomFn;
  formatPercent(value: number): string;
  getLootSeed(run: RunState, zone: ZoneState | null, actNumber: number, encounterNumber: number): number;
  getTargetItemTier(run: RunState, zone: ZoneState | null, actNumber: number, content: GameContent): number;
  getZoneDropCount(zone: ZoneState | null, actNumber: number): number;
  getEquipmentTableEntries(
    run: RunState,
    zone: ZoneState | null,
    actNumber: number,
    content: GameContent,
    profile?: ProfileState | null
  ): ItemSystemEquipmentTableEntry[];
  getPlanningFocusedEquipmentTable(
    equipmentTable: ItemSystemEquipmentTableEntry[],
    run: RunState,
    profile: ProfileState | null,
    content: GameContent
  ): ItemSystemEquipmentTableEntry[];
  getRuneTableEntries(
    run: RunState,
    zone: ZoneState | null,
    actNumber: number,
    content: GameContent
  ): ItemSystemRuneTableEntry[];
  getGuaranteedRuneDropCount(zone: ZoneState | null, run: RunState, content: GameContent): number;
  buildZoneLootTable(config: {
    content: GameContent;
    run: RunState;
    zone: ZoneState | null;
    actNumber: number;
    encounterNumber: number;
    profile?: ProfileState | null;
  }): Array<{
    kind: "equipment" | "rune";
    id: string;
    weight: number;
    dropRate: number;
  }>;
}

interface ItemSystemChoiceApi {
  buildEquipmentChoice(config: {
    content: GameContent;
    run: RunState;
    zone: ZoneState | null;
    actNumber: number;
    encounterNumber: number;
    profile?: ProfileState | null;
  }): RewardChoice | null;
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
  createRuntimeContent(baseContent: GameContent, seedBundle: SeedBundle | null): GameContent;
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
  buildZoneLootTable(config: {
    content: GameContent;
    run: RunState;
    zone: ZoneState | null;
    actNumber: number;
    encounterNumber: number;
    profile?: ProfileState | null;
  }): Array<{
    kind: "equipment" | "rune";
    id: string;
    weight: number;
    dropRate: number;
    rarity?: string;
  }>;
  applyChoice(run: RunState, choice: RewardChoice, content: GameContent): ActionResult;
  listTownActions(run: RunState, profile: ProfileState, content: GameContent): TownAction[];
  applyTownAction(run: RunState, profile: ProfileState, content: GameContent, actionId: string): ActionResult;
  buildCombatBonuses(run: RunState, content: GameContent): ItemBonusSet;
  buildCombatMitigationProfile(run: RunState, content: GameContent): ArmorMitigationProfile | undefined;
  getActiveRunewords(run: RunState, content: GameContent): string[];
  getLoadoutSummary(run: RunState, content: GameContent): string[];
  getInventorySummary(run: RunState, profile: ProfileState, content: GameContent): string[];
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
  primaryTrees: string[];
  supportTrees: string[];
}

interface RewardBuildResolution {
  effect: RewardChoiceEffect;
  previewLine: string;
}

interface RewardEngineArchetypesApi {
  CARD_ROLE_LABELS: Record<CardRewardRole, string>;
  CARD_ROLE_SCORE_WEIGHTS: Record<CardRewardRole, number>;
  SUPPORT_ROLE_PRIORITY: Record<CardRewardRole, number>;
  getDeckProfileId(content: GameContent, classId: string): string;
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
  getArchetypeWeaponFamilies(archetypeId: string): string[];
  getStrategicWeaponFamilies(run: RunState, content: GameContent): string[];
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
    inventoryOpen: boolean;
    inventoryTab: string;
    exploring: boolean;
    explorationEvent: ExplorationEvent | null;
    scrollMapOpen: boolean;
    routeIntelOpen: boolean;
    actTransitionScrollOpen: boolean;
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
