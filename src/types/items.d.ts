type EquipmentSlot = "weapon" | "armor" | "helm" | "shield" | "gloves" | "boots" | "belt" | "ring" | "amulet";
type LoadoutSlotKey = "weapon" | "armor" | "helm" | "shield" | "gloves" | "boots" | "belt" | "ring1" | "ring2" | "amulet";

interface RunEquipmentState {
  entryId: string;
  itemId: string;
  slot: EquipmentSlot;
  socketsUnlocked: number;
  insertedRunes: string[];
  runewordId: string;
  rarity?: string;
  rarityKind?: string;
  rarityBonuses?: ItemBonusSet;
  weaponAffixes?: WeaponCombatProfile;
  armorAffixes?: ArmorMitigationProfile;
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
  sagePurgeCount: number;
  quartermasterDeckSurgeryUsed: boolean;
}

interface ItemTemplateDefinition {
  sourceId: string;
  slot: string;
  family?: string;
  actRequirement: number;
  progressionTier: number;
  bonuses: ItemBonusSet;
  weaponProfile?: WeaponCombatProfile;
  armorProfile?: ArmorMitigationProfile;
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
  helm: RunEquipmentState | null;
  shield: RunEquipmentState | null;
  gloves: RunEquipmentState | null;
  boots: RunEquipmentState | null;
  belt: RunEquipmentState | null;
  ring1: RunEquipmentState | null;
  ring2: RunEquipmentState | null;
  amulet: RunEquipmentState | null;
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
