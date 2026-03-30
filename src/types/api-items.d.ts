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
  isRunewordCompatibleWithItemFamily(
    item: RuntimeItemDefinition | null | undefined,
    runeword: RuntimeRunewordDefinition | null | undefined,
    content: GameContent
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
