interface CardInstance {
  instanceId: string;
  cardId: string;
}

interface CombatHeroState extends HeroDefinition {
  life: number;
  guard: number;
  energy: number;
  alive: boolean;
  damageBonus: number;
  guardBonus: number;
  burnBonus: number;
  // Hero debuffs (applied by enemies)
  heroBurn: number;
  heroPoison: number;
  chill: number;
  amplify: number;
  weaken: number;
  energyDrain: number;
}

interface CombatMercenaryState extends MercenaryDefinition {
  life: number;
  guard: number;
  alive: boolean;
  nextAttackBonus: number;
  markedEnemyId: string;
  markBonus: number;
  contractAttackBonus: number;
  contractBehaviorBonus: number;
  contractStartGuard: number;
  contractHeroDamageBonus: number;
  contractHeroStartGuard: number;
  contractOpeningDraw: number;
  contractPerkLabels: string[];
}

type CombatMinionActionKind =
  | "attack"
  | "attack_mark"
  | "attack_poison"
  | "attack_guard_party"
  | "attack_heal_hero"
  | "heal_party"
  | "buff_mercenary_guard_party"
  | "attack_all_burn"
  | "attack_all_paralyze";

type CombatMinionTargetRule = "selected_enemy" | "lowest_life" | "all_enemies";

interface CombatMinionState {
  id: string;
  templateId: string;
  name: string;
  skillLabel: string;
  actionKind: CombatMinionActionKind;
  targetRule: CombatMinionTargetRule;
  power: number;
  secondaryValue: number;
  remainingTurns: number;
  persistent: boolean;
}

interface CombatEnemyState {
  id: string;
  templateId: string;
  name: string;
  role?: string;
  maxLife: number;
  life: number;
  guard: number;
  burn: number;
  poison: number;
  slow: number;
  freeze: number;
  stun: number;
  paralyze: number;
  alive: boolean;
  intentIndex: number;
  currentIntent: EnemyIntent;
  intents: EnemyIntent[];
  traits?: MonsterTraitKind[];
  family?: string;
  summonTemplateId?: string;
  spawnConfig?: SpawnConfig;
  consumed?: boolean;
  buffedAttack?: number;
  cooldowns?: Record<number, number>;
}

interface CombatSkillModifierState {
  nextCardCostReduction: number;
  nextCardDamageBonus: number;
  nextCardBurn: number;
  nextCardPoison: number;
  nextCardSlow: number;
  nextCardFreeze: number;
  nextCardParalyze: number;
  nextCardDraw: number;
  nextCardGuard: number;
}

interface CombatSkillLoadoutEntry {
  slotKey: RunSkillBarSlotKey;
  skill: RuntimeClassSkillDefinition;
}

interface CombatEquippedSkillState {
  slotKey: RunSkillBarSlotKey;
  skillId: string;
  name: string;
  family: SkillFamilyId;
  slot: ClassSkillSlotNumber;
  tier: ClassSkillTier;
  cost: number;
  cooldown: number;
  remainingCooldown: number;
  chargeCount: number;
  chargesRemaining: number;
  oncePerBattle: boolean;
  usedThisBattle: boolean;
  summary: string;
  exactText: string;
  active: boolean;
  skillType: SkillTypeId;
  damageType: SkillDamageTypeId;
}

interface CombatState {
  encounter: EncounterDefinition;
  randomFn: RandomFn;
  nextCardInstanceId: number;
  turn: number;
  phase: CombatPhase;
  outcome: CombatOutcome | null;
  potions: number;
  hero: CombatHeroState;
  mercenary: CombatMercenaryState;
  minions: CombatMinionState[];
  enemies: CombatEnemyState[];
  drawPile: CardInstance[];
  discardPile: CardInstance[];
  hand: CardInstance[];
  equippedSkills: CombatEquippedSkillState[];
  skillModifiers: CombatSkillModifierState;
  log: string[];
  selectedEnemyId: string;
  meleeUsed?: boolean;
  weaponFamily?: string;
  weaponName?: string;
  weaponDamageBonus?: number;
  weaponProfile?: WeaponCombatProfile | null;
  armorProfile?: ArmorMitigationProfile | null;
  classPreferredFamilies?: string[];
  summonPowerBonus: number;
  summonSecondaryBonus: number;
  deckCardIds: string[];
  cardsPlayed: number;
  potionsUsed: number;
  lowestHeroLife: number;
  lowestMercenaryLife: number;
}

interface CombatMercenaryRouteBonusState {
  contractAttackBonus?: number;
  contractBehaviorBonus?: number;
  contractStartGuard?: number;
  contractHeroDamageBonus?: number;
  contractHeroStartGuard?: number;
  contractOpeningDraw?: number;
  contractPerkLabels?: string[];
}

interface CombatOverrides {
  heroState: HeroDefinition & {
    life: number;
    damageBonus: number;
    guardBonus: number;
    burnBonus: number;
  };
  mercenaryState: MercenaryDefinition & CombatMercenaryRouteBonusState & { life: number };
  starterDeck: string[];
  initialPotions: number;
}
