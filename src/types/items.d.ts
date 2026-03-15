interface RunEquipmentState {
  entryId: string;
  itemId: string;
  slot: "weapon" | "armor";
  socketsUnlocked: number;
  insertedRunes: string[];
  runewordId: string;
  rarity?: string;
  rarityBonuses?: ItemBonusSet;
}

interface InventoryEquipmentEntry {
  entryId: string;
  kind: "equipment";
  equipment: RunEquipmentState;
}

interface InventoryRuneEntry {
  entryId: string;
  kind: "rune";
  runeId: string;
}

type InventoryEntry = InventoryEquipmentEntry | InventoryRuneEntry;

interface RunInventoryState {
  nextEntryId: number;
  carried: InventoryEntry[];
}

interface RunVendorState {
  refreshCount: number;
  stock: InventoryEntry[];
}

interface RunTownState {
  vendor: RunVendorState;
}

interface ItemTemplateDefinition {
  sourceId: string;
  slot: string;
  family?: string;
  actRequirement: number;
  progressionTier: number;
  bonuses: ItemBonusSet;
}

interface RuneTemplateDefinition {
  sourceId: string;
  allowedSlots: string[];
  progressionTier: number;
  bonuses: ItemBonusSet;
}

interface RunewordTemplateDefinition {
  sourceId: string;
  slot: string;
  familyAllowList?: string[];
  requiredRunes: string[];
  bonuses: ItemBonusSet;
}

interface HydratedLoadout {
  weapon: RunEquipmentState | null;
  armor: RunEquipmentState | null;
}

interface AccountEconomyFeatures {
  advancedVendorStock: boolean;
  runewordCodex: boolean;
  economyLedger: boolean;
  salvageTithes: boolean;
  artisanStock: boolean;
  brokerageCharter: boolean;
  treasuryExchange: boolean;
  chronicleExchange: boolean;
  paragonExchange: boolean;
  merchantPrincipate: boolean;
  sovereignExchange: boolean;
  ascendantExchange: boolean;
  tradeHegemony: boolean;
  imperialExchange: boolean;
  mythicExchange: boolean;
  economyFocus: boolean;
}
