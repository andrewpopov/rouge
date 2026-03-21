interface ZoneState {
  id: string;
  actNumber: number;
  title: string;
  kind: ZoneKind;
  zoneRole: ZoneRole;
  description: string;
  encounterIds: string[];
  encounterTotal: number;
  encountersCleared: number;
  visited: boolean;
  cleared: boolean;
  status: "available" | "locked" | "cleared";
  prerequisites: string[];
  nodeId?: string;
  nodeType?: string;
}

interface ActState {
  id: string;
  actNumber: number;
  title: string;
  town: string;
  boss: ActBossSeed & {
    profile: string | null;
  };
  zones: ZoneState[];
  complete: boolean;
}

interface RewardGrants {
  gold: number;
  xp: number;
  potions: number;
}

type RewardChoiceEffectKind =
  | "add_card"
  | "upgrade_card"
  | "hero_max_life"
  | "hero_max_energy"
  | "hero_potion_heal"
  | "hero_damage"
  | "hero_heal"
  | "mercenary_attack"
  | "mercenary_max_life"
  | "belt_capacity"
  | "refill_potions"
  | "gold_bonus"
  | "equip_item"
  | "add_socket"
  | "socket_rune"
  | "record_quest_outcome"
  | "record_quest_follow_up"
  | "record_quest_consequence"
  | "record_node_outcome"
  | "class_point"
  | "attribute_point";

interface RewardChoiceEffect {
  kind: RewardChoiceEffectKind;
  slot?: EquipmentSlot;
  value?: number;
  cardId?: string;
  fromCardId?: string;
  toCardId?: string;
  itemId?: string;
  runeId?: string;
  questId?: string;
  nodeId?: string;
  nodeType?: string;
  outcomeId?: string;
  outcomeTitle?: string;
  consequenceId?: string;
  flagIds?: string[];
  rarity?: string;
  rarityBonuses?: ItemBonusSet;
}

interface RewardChoice {
  id: string;
  kind: string;
  title: string;
  subtitle: string;
  description: string;
  previewLines: string[];
  effects: RewardChoiceEffect[];
}

interface TownAction {
  id: string;
  category: string;
  title: string;
  subtitle: string;
  description: string;
  previewLines: string[];
  cost: number;
  actionLabel: string;
  disabled: boolean;
}

interface RunReward {
  zoneId: string;
  zoneTitle: string;
  kind: ZoneKind;
  title: string;
  lines: string[];
  grants: RewardGrants;
  choices: RewardChoice[];
  encounterNumber: number;
  clearsZone: boolean;
  endsAct: boolean;
  endsRun: boolean;
  heroLifeAfterFight: number;
  mercenaryLifeAfterFight: number;
}

interface QuestOutcomeRecord {
  questId: string;
  zoneId: string;
  actNumber: number;
  title: string;
  outcomeId: string;
  outcomeTitle: string;
  status: "primary_resolved" | "follow_up_resolved" | "chain_resolved";
  followUpNodeId?: string;
  followUpOutcomeId?: string;
  followUpOutcomeTitle?: string;
  consequenceIds: string[];
  flags: string[];
}

interface WorldNodeOutcomeRecord {
  nodeId: string;
  zoneId: string;
  actNumber: number;
  title: string;
  outcomeId: string;
  outcomeTitle: string;
  linkedQuestId?: string;
  flagIds: string[];
}

interface RunWorldState {
  resolvedNodeIds: string[];
  questOutcomes: Record<string, QuestOutcomeRecord>;
  shrineOutcomes: Record<string, WorldNodeOutcomeRecord>;
  eventOutcomes: Record<string, WorldNodeOutcomeRecord>;
  opportunityOutcomes: Record<string, WorldNodeOutcomeRecord>;
  worldFlags: string[];
}

interface RunAttributeState {
  strength: number;
  dexterity: number;
  vitality: number;
  energy: number;
}

interface RunClassProgressionState {
  favoredTreeId: string;
  treeRanks: Record<string, number>;
  unlockedSkillIds: string[];
}

interface RunProgressionState {
  bossTrophies: string[];
  activatedRunewords: string[];
  skillPointsAvailable: number;
  trainingPointsSpent: number;
  classPointsAvailable: number;
  classPointsSpent: number;
  attributePointsAvailable: number;
  attributePointsSpent: number;
  attributes: RunAttributeState;
  classProgression: RunClassProgressionState;
  training: {
    vitality: number;
    focus: number;
    command: number;
  };
}

interface RunState {
  id: string;
  currentActIndex: number;
  acts: ActState[];
  actNumber: number;
  actTitle: string;
  safeZoneName: string;
  bossName: string;
  classId: string;
  className: string;
  hero: HeroDefinition & {
    currentLife: number;
  };
  mercenary: MercenaryDefinition & {
    currentLife: number;
  };
  deck: string[];
  gold: number;
  xp: number;
  level: number;
  belt: {
    current: number;
    max: number;
  };
  inventory: RunInventoryState;
  loadout: {
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
  };
  town: RunTownState;
  progression: RunProgressionState;
  activeZoneId: string;
  activeEncounterId: string;
  pendingReward: RunReward | null;
  world: RunWorldState;
  summary: {
    encountersCleared: number;
    zonesCleared: number;
    actsCleared: number;
    goldGained: number;
    xpGained: number;
    levelsGained: number;
    skillPointsEarned: number;
    classPointsEarned: number;
    attributePointsEarned: number;
    trainingRanksGained: number;
    bossesDefeated: number;
    runewordsForged: number;
  };
}

interface RunClassTreeSummary {
  treeId: string;
  treeName: string;
  archetypeId: string;
  rank: number;
  maxRank: number;
  unlockedSkills: number;
  availableSkills: number;
  isFavored: boolean;
  nextUnlock: string;
  bonusLines: string[];
}

interface RunProgressionSummary {
  skillPointsAvailable: number;
  classPointsAvailable: number;
  attributePointsAvailable: number;
  trainingRanks: number;
  favoredTreeId: string;
  favoredTreeName: string;
  unlockedClassSkills: number;
  nextClassUnlock: string;
  attributeSummaryLines: string[];
  trainingSummaryLines: string[];
  bonusSummaryLines: string[];
  treeSummaries: RunClassTreeSummary[];
}

interface RunHistoryEntry {
  runId: string;
  classId: string;
  className: string;
  level: number;
  actsCleared: number;
  bossesDefeated: number;
  goldGained: number;
  runewordsForged: number;
  skillPointsEarned: number;
  classPointsEarned: number;
  attributePointsEarned: number;
  trainingRanksGained: number;
  favoredTreeId: string;
  favoredTreeName: string;
  unlockedClassSkills: number;
  loadoutTier?: number;
  loadoutSockets?: number;
  carriedEquipmentCount?: number;
  carriedRuneCount?: number;
  stashEntryCount?: number;
  stashEquipmentCount?: number;
  stashRuneCount?: number;
  plannedWeaponRunewordId: string;
  plannedArmorRunewordId: string;
  completedPlannedRunewordIds: string[];
  activeRunewordIds: string[];
  newFeatureIds: string[];
  newCharmIds?: string[];
  completedAt: string;
  outcome: "completed" | "failed" | "abandoned";
}

interface ActionResult {
  ok: boolean;
  message?: string;
}

interface ZoneBeginResult extends ActionResult {
  type?: string;
  zone?: ZoneState;
  encounterId?: string;
  encounterIndex?: number;
  encounterTotal?: number;
  reward?: RunReward;
}
